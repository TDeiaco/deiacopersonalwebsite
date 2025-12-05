import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuddhabrotComponent } from './buddhabrot.component';

describe('BuddhabrotComponent', () => {
  let component: BuddhabrotComponent;
  let fixture: ComponentFixture<BuddhabrotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuddhabrotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BuddhabrotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
