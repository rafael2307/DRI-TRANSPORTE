import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Trip, TripStatus } from './entities/trip.entity';
import { PaymentsService } from '../payments/payments.service';
import { LocationService } from '../location/location.service';

describe('TripsService', () => {
  let service: TripsService;
  let repo: any;

  const mockTripRepo = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    findOne: jest.fn(),
  };

  const mockPaymentsService = {};
  const mockLocationService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: getRepositoryToken(Trip), useValue: mockTripRepo },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: LocationService, useValue: mockLocationService },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    repo = module.get(getRepositoryToken(Trip));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update status to ARRIVED', async () => {
    await service.driverArrived('trip-id');
    expect(repo.update).toHaveBeenCalledWith('trip-id', {
      status: TripStatus.ARRIVED,
    });
  });

  it('should update status to IN_PROGRESS', async () => {
    await service.startTrip('trip-id');
    expect(repo.update).toHaveBeenCalledWith('trip-id', {
      status: TripStatus.IN_PROGRESS,
    });
  });

  it('should update status to COMPLETED', async () => {
    await service.completeTrip('trip-id');
    expect(repo.update).toHaveBeenCalledWith('trip-id', {
      status: TripStatus.COMPLETED,
    });
  });

  it('should update status to CANCELLED', async () => {
    await service.cancelTrip('trip-id');
    expect(repo.update).toHaveBeenCalledWith('trip-id', {
      status: TripStatus.CANCELLED,
    });
  });
});
