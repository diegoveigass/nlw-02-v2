import express from 'express';
import { celebrate, Segments, Joi } from 'celebrate';

import ClassesController from './controllers/ClassesController';
import ConnectionsController from './controllers/ConnectionsController';
import UsersController from './controllers/UsersController';
import SessionsController from './controllers/SessionsController';
import ensureAuthenticated from './middlewares/ensureAuthenticated';
import ResetPasswordController from './controllers/ResetPasswordController';
import ForgotPasswordController from './controllers/ForgotPasswordController';

const classesControllers = new ClassesController();
const connectionsController = new ConnectionsController();
const usersController = new UsersController();
const sessionsController = new SessionsController();
const resetPasswordController = new ResetPasswordController();
const forgotPasswordController = new ForgotPasswordController();

const routes = express.Router();

routes.post('/sessions', sessionsController.create);

routes.post('/users', usersController.create);

routes.post(
  '/forgot_password',
  celebrate({
    [Segments.BODY]: {
      email: Joi.string().email().required(),
    },
  }),
  forgotPasswordController.create,
);
routes.post(
  '/reset_password',
  celebrate({
    [Segments.BODY]: {
      email: Joi.string().email().required(),
      token: Joi.string().required(),
      password: Joi.string().required(),
      password_confirmation: Joi.string().required().valid(Joi.ref('password')),
    },
  }),
  resetPasswordController.create,
);

routes.use(ensureAuthenticated);

routes.put('/profile', usersController.update);

routes.get('/classes', classesControllers.index);
routes.post('/classes', classesControllers.create);

routes.get('/connections', connectionsController.index);
routes.post('/connections', connectionsController.create);

export default routes;
