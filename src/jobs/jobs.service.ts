import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createJobDto, updateJobDto } from './dto/job-dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AiService } from 'src/ai-service/ai-service.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService, private ai: AiService) { }

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
}
