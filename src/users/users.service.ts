import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createUserDto, updateUserDto, loginUserDto } from './dto/user-dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt'
import { AiService } from 'src/ai-service/ai-service.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private jwtService: JwtService, private aiService: AiService) { }

  async createUser(dto: createUserDto) {

    await this.userExistsSignup(dto.email)

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    if (dto.skills) {
      const skills = dto.skills.map(x => x.toLowerCase())
      const embeddings = await this.aiService.generateEmbeddings(skills)

      const user = await this.prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
          skills,
          embeddings
        }
      })

      return {
        message: 'User created successfully',
        data: user
      }
    }

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      }
    })

    return {
      message: 'User created successfully',
      data: user
    }
  }

  async findAll() {
    return this.prisma.user.findMany({})
  }

  async findOne(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email
      }
    })
  }

  async userExists(id: string) {

    const existingUser = await this.prisma.user.findFirst({
      where: {
        id
      }
    })

    if (!existingUser) {
      throw new NotFoundException('No any user with such email found')
    }

    return {
      existingUser
    }


  }

  async userExistsSignup(email: string) {

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email
      }
    })

    if (existingUser) {
      throw new BadRequestException('User with this email already exists')
    }

    return {
      existingUser
    }


  }

  async userExistsLogin(email: string) {

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email
      }
    })

    if (!existingUser) {
      throw new BadRequestException('No any user wtih such email exists')
    }

    return {
      existingUser
    }


  }

  async update(id: string, dto: updateUserDto) {
    const { existingUser } = await this.userExists(id)

    if (dto.skills) {
      const skills = dto.skills.map(x => x.toLowerCase())

      const updatedUser = await this.prisma.user.update({
        where: {
          email: existingUser.email
        },
        data: {
          ...dto,
          skills
        }
      })

      return {
        message: 'User successfully updated',
        data: updatedUser
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        email: existingUser.email
      },
      data: dto
    })

    return {
      message: 'User successfully updated',
      data: updatedUser
    }
  }

  async remove(id: string) {

    const { existingUser } = await this.userExists(id)

    const deletedUser = await this.prisma.user.delete({
      where: {
        email: existingUser.email
      }
    })

    return {
      message: 'User deleted successfully',
      data: deletedUser
    }

  }

  async login(dto: loginUserDto) {

    const { existingUser } = await this.userExistsLogin(dto.email)

    const token = await this.jwtService.signAsync(dto, {
      expiresIn: '7d',
      secret: process.env.JWT_SECRET
    })

    return {
      message: 'Logged in successfully',
      data: token
    }

  }
}
