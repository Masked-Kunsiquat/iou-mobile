// src/services/index.ts
export { PersonService } from './PersonService';
export { DebtService } from './DebtService';
export { BusinessError } from './errors';
export type { 
  CreatePersonRequest, 
  UpdatePersonRequest 
} from './PersonService';
export type { 
  CreateDebtRequest, 
  UpdateDebtRequest, 
  AddPaymentRequest 
} from './DebtService';