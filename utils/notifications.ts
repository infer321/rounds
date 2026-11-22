/**
 * Local timer notifications with "+15 min" and "Done" buttons.
 * Permission is asked lazily, on the first timer.
 * The notification carries only ids (no patient data); the label is shown
 * as the title, and initials only if the user turned that on.
 */
import * as Notifications from 'expo-notifications';

export const SNOOZE = 'snooze15';
export const DONE = 'done';
const CATEGORY = 'timer';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
    shouldShowBanner: true, shouldShowList: true,
  }),
});

Notifications.setNotificationCategoryAsync(CATEGORY, [
  { identifier: SNOOZE, buttonTitle: '+15 min', options: { opensAppToForeground: true } },
  { identifier: DONE, buttonTitle: 'Done', options: { opensAppToForeground: true } },
]).catch(() => undefined);

let asked = false;

export async function scheduleTimer(
  label: string, endsAt: number, ids: { pid: string; itemId: string }, initials?: string,
): Promise<string | undefined> {
  try {
    if (!asked) { asked = true; await Notifications.requestPermissionsAsync(); }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: label,
        body: initials ? `${initials} · timer done` : 'Timer done',
        sound: true,
        categoryIdentifier: CATEGORY,
        data: ids,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endsAt) },
    });
  } catch {
    return undefined; // permission denied or simulator: timer still shows in-app
  }
}

export function cancelTimer(id?: string) {
  if (id) Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}

type Handler = (action: string, ids: { pid: string; itemId: string }) => void;

/** Calls `handle` for notification button taps, including the one that cold-launched the app. */
export function listenForTimerActions(handle: Handler): () => void {
  const seen = new Set<string>();
  const run = (r: Notifications.NotificationResponse | null) => {
    if (!r) return;
    const id = r.notification.request.identifier;
    if (seen.has(id)) return;
    seen.add(id);
    const d = r.notification.request.content.data as { pid?: string; itemId?: string } | undefined;
    if (d?.pid && d.itemId && (r.actionIdentifier === SNOOZE || r.actionIdentifier === DONE)) {
      handle(r.actionIdentifier, { pid: d.pid, itemId: d.itemId });
    }
    Notifications.clearLastNotificationResponse();
  };
  Notifications.getLastNotificationResponseAsync().then(run).catch(() => undefined);
  const sub = Notifications.addNotificationResponseReceivedListener(run);
  return () => sub.remove();
}
