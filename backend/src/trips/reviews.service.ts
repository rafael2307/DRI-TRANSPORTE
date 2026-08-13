import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Trip } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createReview(data: {
    tripId: string;
    reviewerId: string;
    rating: number;
    comment?: string;
  }) {
    const trip = await this.tripRepository.findOne({
      where: { id: data.tripId },
      relations: ['passenger', 'driver'],
    });

    if (!trip) throw new Error('Viaje no encontrado');

    const reviewer = await this.userRepository.findOne({
      where: { id: data.reviewerId },
    });
    if (!reviewer) throw new Error('Revisor no encontrado');

    // Determine reviewee
    const reviewee =
      reviewer.id === trip.passenger.id ? trip.driver : trip.passenger;

    const review = this.reviewRepository.create({
      trip,
      reviewer,
      reviewee,
      rating: data.rating,
      comment: data.comment,
    });

    await this.reviewRepository.save(review);

    // Update reviewee average rating
    await this.updateUserRating(reviewee.id);

    return review;
  }

  private async updateUserRating(userId: string) {
    const reviews = await this.reviewRepository.find({
      where: { reviewee: { id: userId } },
    });
    if (reviews.length === 0) return;

    const average =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await this.userRepository.update(userId, { rating: average });
  }

  async getReviewsForUser(userId: string) {
    return this.reviewRepository.find({
      where: { reviewee: { id: userId } },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
  }
}
