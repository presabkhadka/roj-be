import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { type updateJobDto, type createJobDto } from './dto/job-dto';

@Controller('jobs')
export class JobsController {
  constructor(private jobService: JobsService) { }

  @Post()
  createJob(
    @Body() createJobDto: createJobDto
  ) {
    return this.jobService.createJob(createJobDto)
  }

  @Get()
  fetchAllJob() {
    return this.jobService.findAll()
  }

  @Get(':id')
  fetchUsingTitle(
    @Param('id') id: string
  ) {
    return this.jobService.findExistingUsingId(id)
  }

  @Patch(":id")
  updateJob(
    @Param("id") id: string,
    @Body() dto: updateJobDto
  ) {
    return this.jobService.update(id, dto)
  }
}
