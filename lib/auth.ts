import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './mongodb';

export interface User {
  _id?: ObjectId | string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  scenarios?: UserScenario[];
}

export interface UserScenario {
  id: string;
  name: string;
  language: string;
  context: string;
  createdAt: Date;
  lastPlayed?: Date;
  gamesPlayed: number;
  totalScore: number;
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// Add a type for MongoDB document
interface UserDocument extends Omit<User, '_id'> {
  _id: ObjectId;
}

export class AuthService {
  private static async getDb() {
    const { db } = await connectToDatabase();
    return db;
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async createUser(userData: UserInput): Promise<User> {
    const db = await this.getDb();
    const users = db.collection<UserDocument>('users');

    const existingUser = await users.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    const hashedPassword = await this.hashPassword(userData.password);

    const userDoc: Omit<UserDocument, '_id'> = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date(),
      scenarios: [],
    };

    const result = await users.insertOne(userDoc as UserDocument);
    
    return {
      ...userDoc,
      _id: result.insertedId.toString(),
    } as User;
  }

  static async authenticateUser(loginData: LoginInput): Promise<User | null> {
    const db = await this.getDb();
    const users = db.collection<UserDocument>('users');

    const user = await users.findOne({ email: loginData.email });
    
    if (!user) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(loginData.password, user.password);
    
    if (!isValidPassword) {
      return null;
    }

    return {
      ...user,
      _id: user._id.toString(),
    };
  }

  

  static generateToken(user: User): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(
      {
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyToken(token: string): any {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.getDb();
    const users = db.collection<UserDocument>('users');

    const user = await users.findOne({ email });
    
    if (!user) {
      return null;
    }

    return {
      ...user,
      _id: user._id.toString(),
    };
  }

  static async updateUserScenarios(userEmail: string, scenarios: UserScenario[]): Promise<void> {
    const db = await this.getDb();
    const users = db.collection<UserDocument>('users');

    await users.updateOne(
      { email: userEmail },
      { $set: { scenarios } }
    );
  }
}
