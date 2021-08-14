import http from '../plugins/http';
import BaseService from './BaseService';

interface Shift {
  id: number;
  allowances: {
    value: number;
  }[];
  breaks: {
    start: number;
    finish: number;
  }[];
  date: string;
  department_id: number;
  finish: number | null;
  leave_request_id: number | null;
  start: number | null;
  status: string;
  user_id: number;
}

export interface UserShift {
  date: string;
  weekday: number;
  saturday: number;
  sunday: number;
  holiday: number;
  total: number;
  mileage: number;
}

export interface DepartmentShift {
  key: string;
  departmentId: number;
  date: string;
  weekday: number;
  saturday: number;
  sunday: number;
  holiday: number;
  hours: number;
  mileage: number;
}

class TandaClient extends BaseService {
  private readonly baseUrl = 'https://my.tanda.co/api/v2';

  async getDepartments() {
    const resp = (await http.get(`${this.baseUrl}/departments`)) as {
      id: number;
      name: string;
      record_id: number;
    }[];

    const items: {
      key: string;
      value: { id: number; name: string }[];
    }[] = [];

    resp.forEach((x) => {
      const key = x.name.split('|').slice(-1)[0];
      let item = items.find((e) => e.key == key);
      if (item) {
        item.value.push({ id: x.id, name: x.name });
      } else {
        item = {
          key,
          value: [{ id: x.id, name: x.name }],
        };
        items.push(item);
      }
    });

    return items.sort((a, b) => {
      const nameA = a.key.toUpperCase();
      const nameB = b.key.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }

      if (nameA > nameB) {
        return 1;
      }

      return 0;
    });
  }

  async getPublicHolidays(years: number[]) {
    const resp = (await http.get(
      `${this.baseUrl}/public_holidays?regions=au_nsw&years=${years.join(',')}`
    )) as Record<string, { date: string; name: string }[]>;

    return resp['au_nsw'];
  }

  async getUsers() {
    const resp = (await http.get(`${this.baseUrl}/users`)) as {
      id: number;
      name: string;
    }[];

    return resp.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }

      if (nameA > nameB) {
        return 1;
      }

      return 0;
    });
  }

  async getUserShifts(params: { user_id: number; from: string; to: string }) {
    const fromYear = parseInt(params.from.substring(0, 4), 10);
    const toYear = parseInt(params.to.substring(0, 4), 10);

    const years = [fromYear];
    if (fromYear != toYear) {
      years.push(toYear);
    }

    const holidays = await this.getPublicHolidays(years);

    const resp = (await http.get(`${this.baseUrl}/shifts`, {
      user_ids: [params.user_id],
      from: params.from,
      to: params.to,
      show_notes: true,
    })) as Shift[];

    return resp
      .filter(
        (x) =>
          x.status === 'APPROVED' &&
          x.leave_request_id === null &&
          x.start &&
          x.finish
      )
      .map((x) => {
        const date = new Date(Date.parse(x.date));
        const day = date.getDay();
        const mileage =
          Math.round(x.allowances.reduce((a, b) => a + b.value, 0) * 10) / 10;
        const breaks = x.breaks
          .map((x) => x.finish - x.start)
          .reduce((a, b) => a + b, 0);

        const workHours =
          Math.round(
            ((x.finish as number) - (x.start as number) - breaks) / 360.0
          ) / 10;

        const isHoliday = holidays.findIndex((e) => e.date === x.date) >= 0;

        return {
          date: x.date,
          weekday: !isHoliday && 1 <= day && day <= 5 ? workHours : 0,
          saturday: !isHoliday && day === 6 ? workHours : 0,
          sunday: !isHoliday && day === 0 ? workHours : 0,
          holiday: !isHoliday ? 0 : workHours,
          total: workHours,
          mileage: mileage,
        } as UserShift;
      })
      .reduce((acc, obj) => {
        let item = acc.find((a) => a.date === obj.date);

        if (item) {
          item.weekday = Math.round((item.weekday + obj.weekday) * 10) / 10;
          item.saturday = Math.round((item.saturday + obj.saturday) * 10) / 10;
          item.sunday = Math.round((item.sunday + obj.sunday) * 10) / 10;
          item.holiday = Math.round((item.holiday + obj.holiday) * 10) / 10;
          item.total = Math.round((item.total + obj.total) * 10) / 10;
          item.mileage = Math.round((item.mileage + obj.mileage) * 10) / 10;
        } else {
          item = { ...obj };
          acc.push(item);
        }

        return acc;
      }, [] as Array<UserShift>)
      .sort((a, b) => {
        const dateA = new Date(Date.parse(a.date));
        const dateB = new Date(Date.parse(b.date));
        if (dateA < dateB) {
          return -1;
        }

        if (dateA > dateB) {
          return 1;
        }

        return 0;
      });
  }

  async getDepartmentShifts(params: {
    department_ids: number[];
    from: string;
    to: string;
  }) {
    const fromYear = parseInt(params.from.substring(0, 4), 10);
    const toYear = parseInt(params.to.substring(0, 4), 10);

    const years = [fromYear];
    if (fromYear != toYear) {
      years.push(toYear);
    }

    const holidays = await this.getPublicHolidays(years);

    const resp = (await http.get(`${this.baseUrl}/shifts`, {
      from: params.from,
      to: params.to,
      show_notes: true,
    })) as Shift[];

    return resp
      .filter(
        (x) =>
          params.department_ids.indexOf(x.department_id) >= 0 &&
          x.status === 'APPROVED' &&
          x.leave_request_id === null &&
          x.start &&
          x.finish
      )
      .map((x) => {
        const date = new Date(Date.parse(x.date));
        const day = date.getDay();
        const mileage = x.allowances.reduce((a, b) => a + b.value, 0);
        const breaks = x.breaks
          .map((x) => x.finish - x.start)
          .reduce((a, b) => a + b, 0);

        const isHoliday = holidays.findIndex((e) => e.date === x.date) >= 0;

        const workHours =
          ((x.finish as number) - (x.start as number) - breaks) / 3600.0;

        return {
          key: `${x.date}|${x.department_id}`,
          departmentId: x.department_id,
          date: x.date,
          weekday: !isHoliday && 1 <= day && day <= 5 ? workHours : 0,
          saturday: !isHoliday && day === 6 ? workHours : 0,
          sunday: !isHoliday && day === 0 ? workHours : 0,
          holiday: !isHoliday ? 0 : workHours,
          hours: workHours,
          mileage: mileage,
        } as DepartmentShift;
      })
      .filter((x) => x.hours > 0)
      .reduce((acc, obj) => {
        let item = acc.find((a) => a.key === obj.key);

        if (item) {
          item.weekday = item.weekday + obj.weekday;
          item.saturday = item.saturday + obj.saturday;
          item.sunday = item.sunday + obj.sunday;
          item.holiday = item.holiday + obj.holiday;
          item.hours = item.hours + obj.hours;
          item.mileage = item.mileage + obj.mileage;
        } else {
          item = { ...obj };
          acc.push(item);
        }

        return acc;
      }, [] as Array<DepartmentShift>)
      .sort((a, b) => {
        const dateA = new Date(Date.parse(a.date));
        const dateB = new Date(Date.parse(b.date));
        if (dateA < dateB) {
          return -1;
        }

        if (dateA > dateB) {
          return 1;
        }

        return 0;
      });
  }
}

export default new TandaClient();
