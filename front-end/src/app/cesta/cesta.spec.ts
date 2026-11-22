import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cesta } from './cesta';
import { PedidoService } from '../services/pedido';

describe('Cesta', () => {
  let component: Cesta;
  let fixture: ComponentFixture<Cesta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cesta],
      providers: [
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
