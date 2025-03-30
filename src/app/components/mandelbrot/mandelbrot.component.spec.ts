import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MandelbrotComponent } from './mandelbrot.component';

describe('MandelbrotComponent', () => {
  let component: MandelbrotComponent;
  let fixture: ComponentFixture<MandelbrotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MandelbrotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MandelbrotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
