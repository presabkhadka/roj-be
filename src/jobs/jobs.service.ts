import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createJobDto, updateJobDto } from './dto/job-dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AiService } from 'src/ai-service/ai-service.service';
import { UsersService } from 'src/users/users.service';
import { SimilarityResult } from './types/job-types';
import { MailerService } from '@nestjs-modules/mailer';



@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService, private ai: AiService, private userService: UsersService, private mailerService: MailerService) { }



  async createJob(dto: createJobDto) {
    const { jobExists } = await this.findExisting(dto.title)

    const categories = dto.category.map(x => x.toLowerCase())

    const embeddings = await this.ai.generateEmbeddings(categories)

    const job = await this.prisma.jobs.create({
      data: {
        ...dto,
        category: categories,
        embeddings
      }
    })

    await this.findSimilarity()

    return {
      message: 'Job created successfully',
      data: job,
    }
  }

  findAll() {
    return this.prisma.jobs.findMany({})
  }

  async findExisting(title: string) {
    const jobExists = await this.prisma.jobs.findFirst({
      where: {
        title
      }
    })

    if (jobExists) {
      throw new BadRequestException('A job with that title already exists')
    }

    return {
      jobExists
    }
  }

  async findExistingUsingId(id: string) {
    const jobExists = await this.prisma.jobs.findFirst({
      where: {
        id
      }
    })

    if (!jobExists) {
      throw new NotFoundException('No any job with such id found')
    }

    return {
      jobExists
    }
  }

  findOne(id: string) {
    return this.prisma.jobs.findFirst({
      where: {
        id
      }
    })
  }

  async update(id: string, dto: updateJobDto) {
    await this.findExistingUsingId(id)

    if (dto.category) {
      const categories = dto.category.map(x => x.toLowerCase())
      const updatedJob = await this.prisma.jobs.update({
        where: {
          id
        },
        data: {
          ...dto,
          category: categories
        }
      })

      return {
        message: 'Job successfully updated',
        data: updatedJob
      }
    }

    const updatedJob = await this.prisma.jobs.update({
      where: {
        id
      },
      data: dto
    })

    return {
      message: 'Job successfully updated',
      data: updatedJob
    }
  }

  async remove(id: string) {
    const { jobExists } = await this.findExistingUsingId(id)

    const removedJob = await this.prisma.jobs.delete({
      where: {
        id
      }
    })

    return {
      message: 'Job deleted successfully',
      data: removedJob
    }
  }

  async findAllJobsWithEmbeddings() {
    const jobs = await this.prisma.jobs.findMany();
    return jobs.map(job => ({
      ...job,
      embeddings: Array.isArray(job.embeddings)
        ? job.embeddings
        : [],
    }));
  }

  async findAllUsersWithEmbeddings() {
    const users = await this.userService.findAll();
    return users.map(user => ({
      ...user,
      embeddings: Array.isArray(user.embeddings)
        ? user.embeddings
        : [],
    }));
  }

  async findSimilarity(): Promise<{
    totalComparisons: number;
    topMatchesPerUser: SimilarityResult[];
    allSimilarities: SimilarityResult[];
  }> {
    const allJobs = await this.findAllJobsWithEmbeddings();
    const allUsers = await this.findAllUsersWithEmbeddings();

    const similarityResults: SimilarityResult[] = [];
    const threshold = 0.8;

    for (const user of allUsers) {
      const userSkillsRaw = user.embeddings;

      if (!userSkillsRaw || !Array.isArray(userSkillsRaw) || userSkillsRaw.length === 0) continue;

      const userSkills: number[][] = userSkillsRaw.every(Array.isArray)
        ? (userSkillsRaw as number[][])
        : [(userSkillsRaw as number[])];

      for (const job of allJobs) {
        const jobSkillsRaw = job.embeddings;
        if (!jobSkillsRaw || !Array.isArray(jobSkillsRaw) || jobSkillsRaw.length === 0) continue;

        const jobSkills: number[][] = jobSkillsRaw.every(Array.isArray)
          ? (jobSkillsRaw as number[][])
          : [(jobSkillsRaw as number[])];

        let matches = 0;
        let maxSim = 0;

        for (const uEmb of userSkills) {
          for (const jEmb of jobSkills) {
            if (uEmb.length !== jEmb.length) continue;

            const sim = this.ai.getSimilarity(uEmb, jEmb);
            if (sim >= threshold) matches++;
            if (sim > maxSim) maxSim = sim;
          }
        }

        if (matches > 0) {
          similarityResults.push({
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            jobId: job.id,
            jobTitle: job.title,
            matchedSkills: matches,
            maxSimilarity: maxSim,
          });
        }
      }
    }

    similarityResults.sort((a, b) => b.maxSimilarity - a.maxSimilarity);

    const topMatchesPerUser = Object.values(
      similarityResults.reduce((acc, curr) => {
        if (!acc[curr.userId] || curr.maxSimilarity > acc[curr.userId].maxSimilarity) {
          acc[curr.userId] = curr;
        }
        return acc;
      }, {} as Record<string, SimilarityResult>)
    );


    await Promise.all(
      similarityResults.map(async x => {

        try {
          this.mailerService.sendMail({
            to: x.email,
            subject: `You're a Top Candidate for ${x.jobTitle}!`,
            html: `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background-color: #2a9d8f; color: #ffffff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Exciting Opportunity Awaits!</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; color: #333;">
        <p style="font-size: 16px;">Hello <strong>${x.userName}</strong>,</p>
        <p style="font-size: 16px;">We are thrilled to let you know that you are an excellent match for the position of <strong>${x.jobTitle}</strong>.</p>
        
        <!-- Card -->
        <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
          <h2 style="margin-top: 0; color: #264653;">Job Details</h2>
          <p><strong>Job ID:</strong> ${x.jobId}</p>
          <p><strong>Role:</strong> ${x.jobTitle}</p>
        </div>
        
        <p style="font-size: 16px;">We highly encourage you to apply and take the next step in your career journey. Your skills and experience are exactly what we are looking for!</p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
        </div>
        
        <p style="font-size: 14px; color: #555;">We look forward to seeing your application. Best of luck!</p>
        <p style="font-size: 14px; color: #555;">— The Hiring Team</p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #eee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
        This is an automated message. Please do not reply to this email.
      </div>
    </div>
  </div>
  `
          });
          await new Promise(r => setTimeout(r, 5000));
        } catch (error) {
          throw new Error(error)
        }


        const rejectedCandidates = allUsers.filter(usr => usr.email !== x.email)

        const suggestions = await this.ai.giveSuggestions(x.jobTitle)

        rejectedCandidates.map(async rej => {

          try {
            this.mailerService.sendMail({
              to: rej.email,
              subject: `Thank You for Applying for ${x.jobTitle} — Here's How to Improve!`,
              html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6f9fc; padding: 20px;">
    <div style="max-width: 650px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background-color: #e63946; color: #ffffff; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Thank You for Your Interest</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; color: #333;">
        <p style="font-size: 16px;">Dear <strong>${rej.username || 'Candidate'}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          We sincerely appreciate your interest in the <strong>${x.jobTitle}</strong> position. After careful consideration, we’ve decided to move forward with other candidates whose experience more closely aligns with the job requirements.
        </p>
        
        <!-- Feedback Section -->
        <div style="background-color: #f9fafb; border-left: 4px solid #e63946; border-radius: 6px; padding: 20px; margin: 25px 0;">
          <h2 style="margin-top: 0; color: #1d3557;">Suggestions for Improvement</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">
            ${suggestions}
              </p>
              </div>

              <p style="font-size: 16px; line-height: 1.6;">
                Don’t be discouraged — every great career path includes moments of learning and growth.We truly believe you have potential and encourage you to keep refining your skills and apply again in the future.
        </p>

            <div style="text-align: center; margin: 35px 0;" >
          <a href="#" style = "background-color: #457b9d; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; display: inline-block;" >
          Explore More Opportunities
          </a>
          </div>

          < p style = "font-size: 14px; color: #666;" >
          Thank you again for your time and effort.We wish you every success in your job search and career ahead.
        </p>
            < p style = "font-size: 14px; color: #666;" >— The Hiring Team </p>
              </div>

              < !--Footer -->
                <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #999;" >
                  This is an automated message.Please do not reply to this email.
      </div>
                    </div>
                    </div>
                      `
            });
            await new Promise(r => setTimeout(r, 5000));
          } catch (error) {
            throw new Error(error)
          }
        })
      })
    )

    return {
      totalComparisons: similarityResults.length,
      topMatchesPerUser,
      allSimilarities: similarityResults,
    };
  }
}
