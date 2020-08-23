import express from 'express';
import ClassesController from './controllers/ClassesController';
import ConnectionsController from './controllers/ConnectionsController';
import UsersController from './controllers/UsersController';

const classesControllers = new ClassesController();
const connectionsController = new ConnectionsController();
const usersController = new UsersController();

const routes = express.Router();

routes.post('/users', usersController.create);

routes.get('/classes', classesControllers.index);
routes.post('/classes', classesControllers.create);

routes.get('/connections', connectionsController.index);
routes.post('/connections', connectionsController.create);

export default routes;
