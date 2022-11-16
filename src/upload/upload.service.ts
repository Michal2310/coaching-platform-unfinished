import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import S3 from 'aws-sdk/clients/s3';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async uploadFile(dataBuffer: Buffer, fileName: string, userId: number) {
    try {
      const s3 = new S3({});
      const random = randomBytes(8).toString('hex');
      const uploadResult = await s3
        .upload({
          Bucket: this.config.get('AWS_BUCKET_NAME'),
          Body: dataBuffer,
          Key: `${random}-${fileName}`,
          ACL: 'public-read',
        })
        .promise();

      const imageExists = await this.prisma.images.findUnique({
        where: { userId },
      });

      if (imageExists) {
        await s3
          .deleteObject({
            Bucket: this.config.get('AWS_BUCKET_NAME'),
            Key: imageExists.key,
          })
          .promise();
        return this.prisma.images.update({
          where: {
            userId,
          },
          data: {
            fileName: fileName,
            fileUrl: uploadResult.Location,
            key: uploadResult.Key,
          },
        });
      }

      return await this.prisma.images.create({
        data: {
          fileName: fileName,
          fileUrl: uploadResult.Location,
          key: uploadResult.Key,
          userId,
        },
      });
    } catch (error) {
      throw error;
    }
  }
  async deletePhoto(userId: number) {
    try {
      const s3 = new S3();
      const { key } = await this.prisma.images.findUnique({
        where: { userId },
        select: { key: true },
      });
      await s3
        .deleteObject({
          Bucket: this.config.get('AWS_BUCKET_NAME'),
          Key: key,
        })
        .promise();
      await this.prisma.images.delete({ where: { userId } });
      return { message: 'Image deleted' };
    } catch (error) {
      throw error;
    }
  }
}
