import 'dotenv/config';
import { google } from 'googleapis';
import { login } from './login';
import { DateTime } from 'luxon';

(async function () {
  // EDUPAGE
  const test = await login(
    process.env.EDUPAGE_NAME,
    process.env.EDUPAGE_PASSWORD
  );
  const ids = test.dbi;
  const homework = test.items
    .filter((hw: any) => hw.typ === 'homework')
    .filter((hw: any) => {
      const data = JSON.parse(hw.data);
      return data?.date && data?.triedaid;
    });
  const parsedHomework = homework.map((hw: any) => {
    const data = JSON.parse(hw.data);

    const title = hw.user_meno;
    const due_date = data.date;
    const groups = data.skupiny;
    const description = data.nazov;
    const event_id = data.superid;
    const class_name = ids.classes[data.triedaid.toString()].short;
    const subject_name = ids.subjects[data.predmetid.toString()].short;
    const timestamp = hw.timestamp;
    return {
      title,
      due_date,
      groups,
      description,
      event_id,
      class_name,
      subject_name,
      timestamp,
    };
  });

  // EMAIL
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  const client = new google.auth.GoogleAuth({
    keyFile: 'public/credentials.json',
    scopes,
  });

  const calendar = google.calendar({ version: 'v3', auth: client });

  calendar.events.list({
    calendarId: process.env.EDUPAGE_CALENDAR_ID,
    timeMin: DateTime.now().toISO(),
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
        parsedHomework.forEach((hw: any) => {
          if(events.some((event) => DateTime.fromISO(event.start.dateTime).toISO() === DateTime.fromISO(hw.due_date).plus({ hours: 12 }).toISO() && event.summary === hw.subject_name + ' ' + hw.title))
            return
          if (DateTime.fromISO(hw.due_date) < DateTime.now())
            return;
          calendar.events.insert(
            {
              calendarId: 's8dae0rhqdg4tfil31see7unc4@group.calendar.google.com',
              requestBody: {
                summary: hw.subject_name + ' ' + hw.title,
                description: hw.description,
                start: {
                  dateTime: DateTime.fromISO(hw.due_date).plus({ hours: 12 }).toISO(),
                },
                end: {
                  dateTime: DateTime.fromISO(hw.due_date).plus({ hours: 13 }).toISO(),
                },
              },
            },
            (err: any, event: any) => {
              if (err) console.log('Error', err);
              console.log('SUCCESS', event);
            }
          );
      });
  });
})();
