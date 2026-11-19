const { Model } = require("sequelize");
const ROLES = require("../constants/roles");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Session, {
        foreignKey: "userId",
        as: "sessions",
      });

      User.hasMany(models.EventRegistration, {
        foreignKey: "userId",
        as: "registrations",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM(...Object.values(ROLES)),
        allowNull: false,
        defaultValue: ROLES.USER,
      },

      resetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },

      resetTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "user",
      timestamps: true,
    },
  );

  return User;
};
