import { User } from '../models/User.js';

export class UserService {
  
  // Get or create user session
  static async getOrCreateUser(userId) {
    try {
      let user = await User.findOne({ userId });
      
      if (!user) {
        user = new User({
          userId,
          files: [],
          chatHistory: []
        });
        await user.save();
        console.log(`Created new user session: ${userId}`);
      }
      
      return user;
    } catch (error) {
      console.error('Error getting/creating user:', error);
      throw error;
    }
  }

  // Add file to user session
  static async addFileToUser(userId, fileData) {
    try {
      const user = await this.getOrCreateUser(userId);
      
      user.files.push({
        id: fileData.id,
        originalName: fileData.originalName,
        filename: fileData.filename,
        filePath: fileData.filePath,
        fileType: fileData.fileType,
        collectionName: fileData.collectionName,
        uploadedAt: new Date()
      });
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Error adding file to user:', error);
      throw error;
    }
  }

  // Add chat message to user history
  static async addChatMessage(userId, role, content) {
    try {
      const user = await this.getOrCreateUser(userId);
      
      user.chatHistory.push({
        role,
        content,
        timestamp: new Date()
      });
      
      await user.save();
      return user;
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  // Get user session data
  static async getUserSession(userId) {
    try {
      const user = await this.getOrCreateUser(userId);
      return {
        userId: user.userId,
        files: user.files.map(file => ({
          id: file.id,
          originalName: file.originalName,
          uploadedAt: file.uploadedAt
        })),
        chatHistory: user.chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      };
    } catch (error) {
      console.error('Error getting user session:', error);
      throw error;
    }
  }

  // Get user files for vector operations
  static async getUserFiles(userId) {
    try {
      const user = await User.findOne({ userId });
      return user ? user.files : [];
    } catch (error) {
      console.error('Error getting user files:', error);
      throw error;
    }
  }

  // Clear user chat history
  static async clearChatHistory(userId) {
    try {
      const user = await User.findOne({ userId });
      if (user) {
        user.chatHistory = [];
        await user.save();
      }
      return user;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }

  // Delete user session
  static async deleteUser(userId) {
    try {
      await User.findOneAndDelete({ userId });
      console.log(`Deleted user session: ${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get all users (for admin purposes)
  static async getAllUsers() {
    try {
      return await User.find({}, { userId: 1, createdAt: 1, lastActive: 1, 'files.originalName': 1 });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
}