import logging


def get_logger(logger_name: str, run_log_init: bool = True, loglevel: str = 'INFO') -> logging.Logger:
    if run_log_init:
        logging.basicConfig(format='%(asctime)s [%(levelname)s] %(name)s (%(process)d): %(message)s', level=loglevel)
        logging.getLogger('elasticsearch').setLevel(logging.WARNING)
        logging.getLogger('matplotlib').setLevel(logging.WARNING)
        logging.getLogger('httpcore').setLevel(logging.WARNING)
        logging.getLogger('urllib3').setLevel(logging.WARNING)
        logging.getLogger('httpx').setLevel(logging.WARNING)
        logging.getLogger('filelock').setLevel(logging.WARNING)

        logging.getLogger('root').setLevel(loglevel)

    logger = logging.getLogger(logger_name)
    logger.setLevel(loglevel)

    return logger
