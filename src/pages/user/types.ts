import { ReactNode } from 'react';

export interface Pet {
  id: number;
  name: string;
  type: string;
  breed: string;
  age: string;
  imagePath: string;
  image: string;
  healthStatus: string;
  lastCheckup: string;
  upcomingAppointments: number;
}

export interface MedicalRecordData {
  title: string;
  recordDate: string;
  description: string;
  conditions: string[];
  files?: File[];
}

export interface VaccinationEntry {
  vaccineName: string;
  recordDate: string;
  nextDueDate?: string;
  notes?: string;
  file?: File;
}

export interface VaccinationFormData {
  entries: VaccinationEntry[];
  createReminder: boolean;
  bookAppointment: boolean;
}

export interface UserPetsProps {
  children?: ReactNode;
}

export interface PetCardProps {
  pet: Pet;
  onDelete: (id: number) => void;
  onUploadImage: (id: number, file: File) => Promise<void>;
  onOpenMedicalRecords: (pet: Pet) => void;
  onOpenVaccination: (pet: Pet) => void;
  refreshImage: (petId: number, path: string) => Promise<boolean>;
}

export interface MedicalRecordsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedicalRecordData) => Promise<void>;
  petName: string;
}

export interface VaccinationRecordsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VaccinationFormData) => Promise<void>;
  petName: string;
  petType: string;
}
