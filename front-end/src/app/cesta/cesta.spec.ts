import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cesta } from './cesta';
import { PedidoService } from '../services/pedido';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Cesta', () => {
  let component: Cesta;
  let fixture: ComponentFixture<Cesta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cesta],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PedidoService,
          useValue: { criar: () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Cesta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
