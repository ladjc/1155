import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecSenha } from './rec-senha';

describe('RecSenha', () => {
  let component: RecSenha;
  let fixture: ComponentFixture<RecSenha>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecSenha],
    }).compileComponents();

    fixture = TestBed.createComponent(RecSenha);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
