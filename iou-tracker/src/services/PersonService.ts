// src/services/PersonService.ts
import { Person } from '../models/types';
import { upsertPerson, deletePerson, getPersonById, listAllPeople } from '../db/repo';
import { BusinessError } from './errors';

export type CreatePersonRequest = Omit<Person, 'id'>;
export type UpdatePersonRequest = Omit<Person, 'id'> & { id: string };

export class PersonService {
  /**
   * Create a new person with validation
   */
  static async createPerson(data: CreatePersonRequest): Promise<string> {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      throw new BusinessError('Person name is required');
    }

    if (data.name.trim().length > 100) {
      throw new BusinessError('Person name must be less than 100 characters');
    }

    // Business logic: normalize name
    const normalizedData = {
      ...data,
      name: data.name.trim(),
      contact: data.contact?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    const id = await upsertPerson(normalizedData);
    
    // Could add: logging, analytics, notifications
    console.log(`Person created: ${normalizedData.name} (${id})`);
    
    return id;
  }

  /**
   * Update an existing person
   */
  static async updatePerson(data: UpdatePersonRequest): Promise<void> {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      throw new BusinessError('Person name is required');
    }

    if (data.name.trim().length > 100) {
      throw new BusinessError('Person name must be less than 100 characters');
    }

    // Check if person exists
    const existing = await getPersonById(data.id);
    if (!existing) {
      throw new BusinessError('Person not found');
    }

    // Business logic: normalize data
    const normalizedData = {
      ...data,
      name: data.name.trim(),
      contact: data.contact?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    await upsertPerson(normalizedData);
    
    console.log(`Person updated: ${normalizedData.name} (${data.id})`);
  }

  /**
   * Delete a person with business rule validation
   */
  static async deletePerson(id: string): Promise<void> {
    // Business rule: Check if person exists
    const person = await getPersonById(id);
    if (!person) {
      throw new BusinessError('Person not found');
    }

    try {
      // The repo function will check for open debts and throw if any exist
      await deletePerson(id);
      
      console.log(`Person deleted: ${person.name} (${id})`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('open debts')) {
        throw new BusinessError('Cannot delete person with open debts. Settle all debts first.');
      }
      throw error;
    }
  }

  /**
   * Get person by ID with error handling
   */
  static async getPersonById(id: string): Promise<Person | null> {
    if (!id) {
      throw new BusinessError('Person ID is required');
    }

    return await getPersonById(id);
  }

  /**
   * List all people with business logic
   */
  static async listAllPeople(): Promise<Person[]> {
    const people = await listAllPeople();
    
    // Business logic: could add filtering, sorting, etc.
    return people.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Upsert person (create or update based on ID presence)
   */
  static async upsertPerson(
    person: Omit<Person, 'id'> & Partial<Pick<Person, 'id'>>
  ): Promise<string> {
    if (person.id) {
      await this.updatePerson({ ...person, id: person.id });
      return person.id;
    } else {
      return await this.createPerson(person);
    }
  }
}