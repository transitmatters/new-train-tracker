import threading
import time
import schedule


# Copied from https://schedule.readthedocs.io/en/stable/background-execution.html


def run_continuously(interval_s=1) -> threading.Event:
    """Continuously run, while executing pending jobs at each
    elapsed time interval.
    @return cease_continuous_run: threading. Event which can
    be set to cease continuous run. Please note that it is
    *intended behavior that run_continuously() does not run
    missed jobs*. For example, if you've registered a job that
    should run every minute and you set a continuous run
    interval of one hour then your job won't be run 60 times
    at each interval but only once.
    """
    cease_continuous_run = threading.Event()

    class ScheduleThread(threading.Thread):
        @classmethod
        def run(cls):
            while not cease_continuous_run.is_set():
                schedule.run_pending()
                time.sleep(interval_s)

    # preston added daemon=True. By making it a daemon thread, the main thread getting a signal
    # will cause only the background thread to remain, and Python will then exit fully. Without that,
    # the background thread will continue to run.
    # See https://docs.python.org/3/library/threading.html#threading.Thread.daemon
    continuous_thread = ScheduleThread(daemon=True)
    continuous_thread.start()
    return cease_continuous_run
