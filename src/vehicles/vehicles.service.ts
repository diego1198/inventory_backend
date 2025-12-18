import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    // Verificar si la placa ya existe
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { plate: createVehicleDto.plate.toUpperCase() },
    });

    if (existingVehicle) {
      throw new ConflictException('Ya existe un vehículo con esta placa');
    }

    const vehicle = this.vehiclesRepository.create({
      ...createVehicleDto,
      plate: createVehicleDto.plate.toUpperCase(),
    });

    return this.vehiclesRepository.save(vehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      where: { isActive: true },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return vehicle;
  }

  async findByPlate(plate: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { plate: plate.toUpperCase() },
      relations: ['customer'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return vehicle;
  }

  async findByCustomer(customerId: string): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      where: { customerId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    // Si se actualiza la placa, verificar que no exista
    if (updateVehicleDto.plate && updateVehicleDto.plate.toUpperCase() !== vehicle.plate) {
      const existingVehicle = await this.vehiclesRepository.findOne({
        where: { plate: updateVehicleDto.plate.toUpperCase() },
      });

      if (existingVehicle) {
        throw new ConflictException('Ya existe un vehículo con esta placa');
      }

      updateVehicleDto.plate = updateVehicleDto.plate.toUpperCase();
    }

    Object.assign(vehicle, updateVehicleDto);
    return this.vehiclesRepository.save(vehicle);
  }

  async updateMileage(id: string, mileage: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    
    if (mileage < vehicle.currentMileage) {
      throw new ConflictException('El nuevo kilometraje no puede ser menor al actual');
    }

    vehicle.currentMileage = mileage;
    return this.vehiclesRepository.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    vehicle.isActive = false;
    await this.vehiclesRepository.save(vehicle);
  }

  async search(query: string): Promise<Vehicle[]> {
    return this.vehiclesRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .where('vehicle.isActive = :isActive', { isActive: true })
      .andWhere(
        '(UPPER(vehicle.plate) LIKE :query OR UPPER(vehicle.brand) LIKE :query OR UPPER(vehicle.model) LIKE :query OR UPPER(customer.name) LIKE :query)',
        { query: `%${query.toUpperCase()}%` },
      )
      .orderBy('vehicle.createdAt', 'DESC')
      .getMany();
  }
}
