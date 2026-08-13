import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async createReview(
    @Body()
    body: {
      tripId: string;
      reviewerId: string;
      rating: number;
      comment?: string;
    },
  ) {
    return this.reviewsService.createReview(body);
  }

  @Get('user/:userId')
  async getReviews(@Param('userId') userId: string) {
    return this.reviewsService.getReviewsForUser(userId);
  }
}
