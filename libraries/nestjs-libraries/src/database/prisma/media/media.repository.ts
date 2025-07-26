import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SaveMediaInformationDto } from '@gitroom/nestjs-libraries/dtos/media/save.media.information.dto';

@Injectable()
export class MediaRepository {
  constructor(private _media: PrismaRepository<'media'>) {}

  saveFile(org: string, fileName: string, filePath: string) {
    // Determine media type based on file extension
    const isVideo = fileName.toLowerCase().includes('.mp4') || 
                   fileName.toLowerCase().includes('.mov') || 
                   fileName.toLowerCase().includes('.avi') || 
                   fileName.toLowerCase().includes('.webm') ||
                   filePath.toLowerCase().includes('.mp4') || 
                   filePath.toLowerCase().includes('.mov') || 
                   filePath.toLowerCase().includes('.avi') || 
                   filePath.toLowerCase().includes('.webm');
    
    return this._media.model.media.create({
      data: {
        organization: {
          connect: {
            id: org,
          },
        },
        name: fileName,
        path: filePath,
        type: isVideo ? 'video' : 'image',
      },
      select: {
        id: true,
        name: true,
        path: true,
        thumbnail: true,
        alt: true,
        type: true,
      },
    });
  }

  getMediaById(id: string) {
    return this._media.model.media.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        path: true,
        thumbnail: true,
        alt: true,
        type: true,  // ← AJOUT DU CHAMP TYPE !
        thumbnailTimestamp: true,
      },
    });
  }

  deleteMedia(org: string, id: string) {
    return this._media.model.media.update({
      where: {
        id,
        organizationId: org,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  saveMediaInformation(org: string, data: SaveMediaInformationDto) {
    return this._media.model.media.update({
      where: {
        id: data.id,
        organizationId: org,
      },
      data: {
        alt: data.alt,
        thumbnail: data.thumbnail,
        thumbnailTimestamp: data.thumbnailTimestamp,
      },
      select: {
        id: true,
        name: true,
        alt: true,
        thumbnail: true,
        path: true,
        thumbnailTimestamp: true,
      },
    });
  }

  async getMedia(org: string, page: number) {
    const pageNum = (page || 1) - 1;
    const query = {
      where: {
        organization: {
          id: org,
        },
      },
    };
    const pages =
      pageNum === 0
        ? Math.ceil((await this._media.model.media.count(query)) / 28)
        : 0;
    const results = await this._media.model.media.findMany({
      where: {
        organizationId: org,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        path: true,
        thumbnail: true,
        alt: true,
        thumbnailTimestamp: true,
      },
      skip: pageNum * 28,
      take: 28,
    });

    return {
      pages,
      results,
    };
  }

  async migrateMediaTypes(orgId?: string) {
    // Find all media that need type correction
    const whereClause = {
      deletedAt: null,
      ...(orgId ? { organizationId: orgId } : {}),
    };

    const mediasToUpdate = await this._media.model.media.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        path: true,
        type: true,
      },
    });

    let updatedCount = 0;

    for (const media of mediasToUpdate) {
      // Determine correct type based on file extension
      const isVideo = media.name.toLowerCase().includes('.mp4') || 
                     media.name.toLowerCase().includes('.mov') || 
                     media.name.toLowerCase().includes('.avi') || 
                     media.name.toLowerCase().includes('.webm') ||
                     media.path.toLowerCase().includes('.mp4') || 
                     media.path.toLowerCase().includes('.mov') || 
                     media.path.toLowerCase().includes('.avi') || 
                     media.path.toLowerCase().includes('.webm');
      
      const correctType = isVideo ? 'video' : 'image';

      // Only update if the type is incorrect
      if (media.type !== correctType) {
        await this._media.model.media.update({
          where: { id: media.id },
          data: { type: correctType },
        });
        updatedCount++;
      }
    }

    return {
      totalMedias: mediasToUpdate.length,
      updatedCount,
      message: `Updated ${updatedCount} media(s) out of ${mediasToUpdate.length} total media(s)`,
    };
  }
}
