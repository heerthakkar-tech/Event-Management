"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Event extends Model {
    static associate(models) {
      Event.belongsTo(models.User, {
        foreignKey: "organizerId",
        as: "organizer",
      });

      Event.belongsTo(models.Category, {
        foreignKey: "categoryId",
        as: "category",
      });
    }
  }

  Event.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      organizerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      startAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      endAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      location: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      ticketPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("draft", "scheduled", "published", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },

      publishAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      bannerUrl: {
        type: DataTypes.STRING(2048),
        allowNull: true,
      },

      bannerPublicId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Event",
      tableName: "event",
      timestamps: true,
      paranoid: true,
    },
  );

  return Event;
};
