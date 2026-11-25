import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { FIREBASE_AUTH } from './firebase/firebase';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: FIREBASE_AUTH, useValue: null }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows that Firebase needs configuration when no Auth instance is available', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('grd.todo');
    expect(compiled.textContent).toContain('Firebase ainda não está configurado');
    expect(compiled.querySelector('button')).toBeNull();
  });
});
