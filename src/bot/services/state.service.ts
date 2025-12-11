import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';

export interface UserState {
  action: string;
  data?: any;
}

@Injectable()
export class StateService {
  private userStates = new Map<number, UserState>();

  setState(userId: number, state: UserState) {
    this.userStates.set(userId, state);
  }

  getState(userId: number): UserState | undefined {
    return this.userStates.get(userId);
  }

  deleteState(userId: number) {
    this.userStates.delete(userId);
  }

  hasState(userId: number): boolean {
    return this.userStates.has(userId);
  }
}
