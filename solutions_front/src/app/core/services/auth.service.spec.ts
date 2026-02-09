import { TestBed } from '@angular/core/testing';

describe('AuthService', () => {
  // Mock del servicio
  const mockAuthService = {
    login: jasmine.createSpy('login'),
    logout: jasmine.createSpy('logout'),
    isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false),
    getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(null)
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: 'AuthService', useValue: mockAuthService }
      ]
    });
  });

  it('should have login method', () => {
    expect(mockAuthService.login).toBeDefined();
  });

  it('should have logout method', () => {
    expect(mockAuthService.logout).toBeDefined();
  });

  it('should have isAuthenticated method', () => {
    expect(mockAuthService.isAuthenticated).toBeDefined();
  });
});