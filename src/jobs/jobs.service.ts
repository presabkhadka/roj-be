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
      similarityResults.map(x => {
        this.mailerService.sendMail({
          to: x.email,
          subject: `You are the best fit for this job ${x.jobTitle}`,
          text: `Hi ${x.userName}, We came to know that you are the best fit for this job ${x.jobId}`
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
