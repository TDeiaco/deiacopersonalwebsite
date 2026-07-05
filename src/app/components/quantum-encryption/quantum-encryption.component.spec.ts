import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantumEncryptionComponent } from './quantum-encryption.component';

describe('QuantumEncryptionComponent', () => {
  let component: QuantumEncryptionComponent;
  let fixture: ComponentFixture<QuantumEncryptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuantumEncryptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuantumEncryptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});