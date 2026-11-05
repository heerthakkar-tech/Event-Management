"use strict";
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const ROLES = require("../constants/roles");

require("dotenv").config();
module.exports = {
  async up(queryInterface, Sequelize) {
    const name = process.env.SUPER_ADMIN_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!name || !email || !password) {
      throw new Error(
        "Please set SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD in your .env file",
      );
    }
    const existingAdmin = await queryInterface.rawSelect(
      "user",
      {
        where: {
          email,
          role: ROLES.SUPER_ADMIN,
        },
      },
      ["id"],
    );

    if (existingAdmin) {
      console.log("Super Admin already exists. Skipping seeder.");
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await queryInterface.bulkInsert(
      "user",
      [
        {
          id: crypto.randomUUID(),
          name,
          email,
          password: hashedPassword,
          role: ROLES.SUPER_ADMIN,
          resetToken: null,
          resetTokenExpiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    const email = process.env.SUPER_ADMIN_EMAIL;

    if (!email) {
      throw new Error("SUPER_ADMIN_EMAIL is missing from .env file");
    }

    await queryInterface.bulkDelete(
      "user",
      {
        email,
        role: ROLES.SUPER_ADMIN,
      },
      {},
    );
  },
};
