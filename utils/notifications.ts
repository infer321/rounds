/** Local timer notifications. Permission is asked lazily, on the first timer. */
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
    shouldShowBanner: true, shouldShowList: true,
  }),
});

let asked = false;

export async function scheduleTimer(label: string, endsAt: number, initials?: string): Promise<string | undefined> {
  try {
    if (!asked) { asked = true; await Notifications.requestPermissionsAsync(); }
    return await Notifications.scheduleNotificationAsync({
      content: { title: label, body: initials ? `${initials} · timer done` : 'Timer done', sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endsAt) },
    });
  } catch {
    return undefined; // permission denied or simulator: timer still shows in-app
  }
}

export function cancelTimer(id?: string) {
  if (id) Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
