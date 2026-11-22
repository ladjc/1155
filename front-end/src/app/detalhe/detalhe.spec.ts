import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Detalhe } from './detalhe';
import { ProdutoService } from '../services/produto';

describe('Detalhe', () => {
  let component: Detalhe;
  let fixture: ComponentFixture<Detalhe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Detalhe],
      providers: [
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: ProdutoService, useValue: { getProdutoPorId: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Detalhe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
