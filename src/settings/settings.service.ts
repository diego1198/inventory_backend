import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  // Default settings que se crean si no existen
  private readonly defaultSettings = [
    {
      key: 'IVA_RATE',
      value: '0.15',
      description: 'Porcentaje de IVA (0.15 = 15%)',
      type: 'number',
    },
    {
      key: 'BUSINESS_NAME',
      value: 'Mi Empresa',
      description: 'Nombre del negocio para facturas',
      type: 'string',
    },
    {
      key: 'BUSINESS_RUC',
      value: '',
      description: 'RUC/NIT del negocio',
      type: 'string',
    },
    {
      key: 'BUSINESS_ADDRESS',
      value: '',
      description: 'Dirección del negocio',
      type: 'string',
    },
    {
      key: 'BUSINESS_PHONE',
      value: '',
      description: 'Teléfono del negocio',
      type: 'string',
    },
    {
      key: 'BUSINESS_EMAIL',
      value: '',
      description: 'Email del negocio',
      type: 'string',
    },
    {
      key: 'CURRENCY_SYMBOL',
      value: '$',
      description: 'Símbolo de moneda',
      type: 'string',
    },
    {
      key: 'INVOICE_FOOTER',
      value: 'Gracias por su compra',
      description: 'Mensaje de pie de factura',
      type: 'string',
    },
    // Theme settings
    {
      key: 'THEME_PRIMARY_COLOR',
      value: '#8b5cf6',
      description: 'Color primario del tema',
      type: 'string',
    },
    {
      key: 'THEME_SECONDARY_COLOR',
      value: '#3b82f6',
      description: 'Color secundario del tema',
      type: 'string',
    },
    {
      key: 'THEME_ACCENT_COLOR',
      value: '#06b6d4',
      description: 'Color de acento del tema',
      type: 'string',
    },
    {
      key: 'THEME_SIDEBAR_COLOR',
      value: '#1e293b',
      description: 'Color del sidebar',
      type: 'string',
    },
    {
      key: 'THEME_PRESET',
      value: 'purple',
      description: 'Preset de tema: purple, blue, green, orange, red',
      type: 'string',
    },
  ];

  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async onModuleInit() {
    // Crear configuraciones por defecto si no existen
    for (const defaultSetting of this.defaultSettings) {
      const existing = await this.settingsRepository.findOne({
        where: { key: defaultSetting.key },
      });
      if (!existing) {
        await this.settingsRepository.save(defaultSetting);
      }
    }
  }

  async findAll(): Promise<Setting[]> {
    return this.settingsRepository.find({
      order: { key: 'ASC' },
    });
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return setting;
  }

  async getValue(key: string): Promise<string | number | boolean | object> {
    const setting = await this.findByKey(key);
    return this.parseValue(setting.value, setting.type);
  }

  async getIvaRate(): Promise<number> {
    try {
      const setting = await this.findByKey('IVA_RATE');
      const value = parseFloat(setting.value);
      return isNaN(value) ? 0 : value;
    } catch {
      // Si no existe en DB, usar variable de entorno
      const envIva = process.env.IVA;
      return envIva ? parseFloat(envIva) : 0;
    }
  }

  async getBusinessSettings(): Promise<Record<string, string | number | boolean | object>> {
    const settings = await this.findAll();
    const result: Record<string, string | number | boolean | object> = {};
    
    for (const setting of settings) {
      result[setting.key] = this.parseValue(setting.value, setting.type);
    }
    
    return result;
  }

  async create(createSettingDto: CreateSettingDto): Promise<Setting> {
    const setting = this.settingsRepository.create(createSettingDto);
    return this.settingsRepository.save(setting);
  }

  async update(key: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findByKey(key);
    Object.assign(setting, updateSettingDto);
    return this.settingsRepository.save(setting);
  }

  async updateValue(key: string, value: string): Promise<Setting> {
    const setting = await this.findByKey(key);
    setting.value = value;
    return this.settingsRepository.save(setting);
  }

  async remove(key: string): Promise<void> {
    const setting = await this.findByKey(key);
    await this.settingsRepository.remove(setting);
  }

  private parseValue(value: string, type: string): string | number | boolean | object {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }
}
