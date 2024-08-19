import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;  // Use the environment variable for the API URL
  private socialLoginUrl = `${this.apiUrl}/social-login`;  // Backend endpoint for social login verification
  private loginUrl = `${this.apiUrl}/login`;  // Backend endpoint for manual login
  private registerUrl = `${this.apiUrl}/register`;  // Backend endpoint for registration
  private userDetails: User | null = null;

  constructor(private http: HttpClient) {}

  // Social login verification method
  verifySocialLogin(authCode: string, provider: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { authCode, provider };
    return this.http.post<any>(this.socialLoginUrl, body, { headers }).pipe(
      map(response => {
        console.log('Social login successful', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  // Manual login method
  login(credentials: { username: string; password: string }): Observable<User> {
    console.log('Login method called with credentials:', credentials); // Log the credentials
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<User>(this.loginUrl, credentials, { headers }).pipe(
      map((response: any) => {
        const userId = response.userId;
        const username = response.username;
        const token = response.token;

        this.userDetails = {
          id: userId,
          username: username,
          password: '',
          token: token
        };

        localStorage.setItem('user', JSON.stringify(this.userDetails));
        localStorage.setItem('jwtToken', token);

        console.log('Stored JWT Token:', token);  // Log the stored token

        return this.userDetails;
      }),
      catchError(this.handleError)
    );
  }

  // Registration method
  register(credentials: { username: string; password: string }): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.registerUrl, credentials, { headers }).pipe(
      map((response: any) => {
        console.log('Registration successful', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  // Method to get the JWT token from localStorage
  private getToken(): string | null {
    return localStorage.getItem('jwtToken');
  }

  // Check token retrieval
  private debugToken(): void {
    const token = this.getToken();
    console.log('JWT Token from localStorage:', token);
  }

  // Include the token in the headers for authenticated requests
  public getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    console.log('Retrieved JWT Token:', token);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    console.log('Auth Headers:', headers);
    return headers;
  }

  // Handle error response
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error:', error.message);
    return throwError(() => new Error('Error: ' + error.message));
  }

  // Check if the user is authenticated
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Get user details
  getUserDetails(): Observable<User> {
    if (!this.userDetails) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.userDetails = JSON.parse(storedUser);
      }
    }
    return new Observable((observer) => {
      if (this.userDetails) {
        observer.next(this.userDetails);
      } else {
        observer.error('User not authenticated.');
      }
    });
  }

  // Set user details manually (if needed)
  setUserDetails(user: User): void {
    this.userDetails = user;
    localStorage.setItem('user', JSON.stringify(this.userDetails));
  }

  // Logout method
  logout(): Observable<any> {
    this.userDetails = null;
    localStorage.removeItem('user');
    localStorage.removeItem('jwtToken');
    return new Observable((observer) => observer.next(true));
  }

  // Method for authenticated requests (example: fetching tasks)
  getTasks(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/tasks`, { headers }).pipe(
      catchError(this.handleError)
    );
  }
}
