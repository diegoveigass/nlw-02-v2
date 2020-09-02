import { Request, Response } from 'express';
import db from '../database/connection';
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface ScheduleItemProps {
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesController {
  async index(request: Request, response: Response) {
    const filters = request.query;
    const { page = 1 } = request.query;

    const subject = filters.subject as string;
    const week_day = filters.week_day as string;
    const time = filters.time as string;

    if (!week_day || !subject || !time) {
      const classes = await db('classes')
        .join('users', 'classes.user_id', '=', 'users.id')
        .select(['classes.*', 'name', 'avatar', 'bio', 'whatsapp'])
        .limit(5)
        .offset((Number(page) - 1) * 5);

      const newClasses = classes.map(async classe => {
        classe.schedule = await db('class_schedule')
          .where('user_id', classe.user_id)
          .whereRaw('class_id = ??', [classe.id]);

        return classe;
      });

      const Teachers = await Promise.all(newClasses);

      return response.json({ Teachers, count: classes.length });
    }

    const timeInMinutes = convertHourToMinutes(time);

    const classes = await db('classes')
      .whereExists(function () {
        this.select('class_schedule.*')
          .from('class_schedule')
          .whereRaw('class_schedule.class_id = classes.id')
          .whereRaw('class_schedule.week_day = ??', [Number(week_day)])
          .whereRaw('class_schedule.from_minutes <= ??', [timeInMinutes])
          .whereRaw('class_schedule.to_minutes > ??', [timeInMinutes]);
      })
      .where('classes.subject', '=', subject)
      .join('users', 'classes.user_id', '=', 'users.id')
      .select(['classes.*', 'name', 'avatar', 'bio', 'whatsapp'])
      .limit(5)
      .offset((Number(page) - 1) * 5);

    const newClasses = classes.map(async classe => {
      classe.schedule = await db('class_schedule')
        .where('user_id', classe.user_id)
        .whereRaw('class_id = ??', [classe.id]);

      return classe;
    });

    const Teachers = await Promise.all(newClasses);

    return response.json({ Teachers, count: classes.length });
  }

  async create(request: Request, response: Response) {
    const { whatsapp, bio, subject, cost, schedule } = request.body;

    const { id } = request.user;

    const trx = await db.transaction();

    try {
      if (whatsapp || bio) {
        await trx('users').where('id', id).update({
          whatsapp,
          bio,
        });
      }

      // await trx('classes').where('user_id', id).del();
      // await trx('class_schedule').where('user_id', id).del();

      const insertedClassesIds = await trx('classes')
        .insert({
          user_id: id,
          subject,
          cost,
        })
        .returning('id');

      const class_id = insertedClassesIds[0];

      const classSchedule = schedule.map((scheduleItem: ScheduleItemProps) => {
        return {
          user_id: id,
          class_id,
          week_day: scheduleItem.week_day,
          from: scheduleItem.from,
          to: scheduleItem.to,
          from_minutes: convertHourToMinutes(scheduleItem.from),
          to_minutes: convertHourToMinutes(scheduleItem.to),
        };
      });

      await trx('class_schedule').insert(classSchedule);

      await trx.commit();

      return response.status(201).send();
    } catch (err) {
      await trx.rollback();

      console.log(err.message);

      return response.status(400).json({
        error: 'Unexpected error while creating new class',
      });
    }
  }
}
