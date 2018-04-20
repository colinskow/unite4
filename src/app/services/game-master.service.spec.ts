import { TestBed, inject } from '@angular/core/testing';

import { GameMasterService } from './game-master.service';

describe('GameMasterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameMasterService]
    });
  });

  it('should be created', inject([GameMasterService], (service: GameMasterService) => {
    expect(service).toBeTruthy();
  }));
});
