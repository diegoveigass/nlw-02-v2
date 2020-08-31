import { Request, Response } from 'express';
import { hash } from 'bcryptjs';

import db from '../database/connection';

export default class UsersController {
  async create(request: Request, response: Response) {
    const { name, email, password } = request.body;

    const userExists = await db('users').where('email', email);

    if (userExists.length !== 0) {
      return response.status(400).json({ error: 'User already exists' });
    }

    const password_hash = await hash(password, 8);

    const trx = await db.transaction();

    try {
      await trx('users').insert({
        name,
        email,
        password_hash,
      });

      await trx.commit();

      return response.status(201).send();
    } catch (err) {
      console.log(err);

      await trx.rollback();

      return response.status(400).json({
        error: 'Unexpect error while creating a user',
      });
    }
  }
}
