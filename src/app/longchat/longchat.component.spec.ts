import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LongchatComponent } from './longchat.component';

describe('LongchatComponent', () => {
  let component: LongchatComponent;
  let fixture: ComponentFixture<LongchatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LongchatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LongchatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
