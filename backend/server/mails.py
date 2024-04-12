import logging
from email.message import EmailMessage

from smtplib import (
    SMTP as SMTPSync,
    SMTP_SSL,
    SMTPHeloError as SMTPHeloErrorOrig,
    SMTPNotSupportedError,
    SMTPDataError,
    SMTPRecipientsRefused as SMTPRecipientsRefusedOrig,
    SMTPSenderRefused as SMTPSenderRefusedOrig,
    SMTPException as SMTPExceptionOrig
)
from aiosmtplib import (
    SMTP,
    SMTPResponseException,
    SMTPSenderRefused,
    SMTPRecipientsRefused,
    SMTPException,
    SMTPAuthenticationError,
    SMTPNotSupported,
    SMTPConnectTimeoutError,
    SMTPConnectError,
    SMTPConnectResponseError,
    SMTPServerDisconnected,
    SMTPHeloError, SMTPTimeoutError
)

from .config import settings
from .datasets import Dataset

logger = logging.getLogger('server.util.email')


class EmailNotSentError(Exception):
    """
    Thrown when an email was not sent for some reason
    """
    pass


def mailing_active(dataset: Dataset) -> bool:
    return settings.MAILING_ENABLED and dataset.full_info.contact and len(dataset.full_info.contact) > 0


def construct_email(subject: str,
                    message: str,
                    to: list[str] | None = None,
                    cc: list[str] | None = None,
                    bcc: list[str] | None = None,
                    sender: str | None = None) -> EmailMessage:
    if sender is None:
        sender = settings.MAILING_SENDER

    email = EmailMessage()
    email.set_content(message)
    email['Subject'] = subject
    email['From'] = sender

    if to:
        email['To'] = ', '.join(to)
    if cc:
        email['Cc'] = ', '.join(cc)
    if bcc:
        email['Bcc'] = ', '.join(bcc)

    return email


async def send_message(subject: str,
                       message: str,
                       to: list[str] | None = None,
                       cc: list[str] | None = None,
                       bcc: list[str] | None = None,
                       sender: str | None = None,
                       quiet: bool = False) -> bool:
    email = construct_email(sender=sender, to=to, cc=cc, bcc=bcc, subject=subject, message=message)
    return await send_email(email, quiet=quiet)


async def send_email(email: EmailMessage, quiet: bool) -> bool:
    if not settings.MAILING_ENABLED:
        if quiet:
            return False
        raise EmailNotSentError(f'Mailing system inactive, '
                                f'email with subject "{email["Subject"]}" not sent to {email["To"]}')

    if email['From'] is None:
        del email['From']
        email['From'] = settings.MAILING_SENDER

    client = SMTP(hostname=settings.SMTP_HOST,
                  port=settings.SMTP_PORT,
                  use_tls=settings.SMTP_TLS,
                  start_tls=settings.SMTP_START_TLS,
                  validate_certs=settings.SMTP_CHECK_CERT,
                  username=settings.SMTP_USER,
                  password=settings.SMTP_PASSWORD)
    try:
        await client.connect()
        logger.debug(f'Trying to send email to {email["To"]} with subject "{email["Subject"]}"')
        status = await client.send_message(email)
        logger.debug(status)
        # await client.quit()  # FIXME: Is this necessary? Docs say yes, but then it doesn't work...
        logger.info(f'Successfully sent email to {email["To"]} with subject "{email["Subject"]}"')
        return True

    except (SMTPRecipientsRefused, SMTPResponseException, ValueError, SMTPException, SMTPTimeoutError,
            SMTPAuthenticationError, SMTPNotSupported, SMTPConnectTimeoutError, SMTPConnectError,
            SMTPConnectResponseError, SMTPServerDisconnected, SMTPHeloError, SMTPSenderRefused) as e:
        logger.warning(f'Failed sending email to {email["To"]} with subject "{email["Subject"]}"')
        logger.error(e)
        await client.quit()

        raise EmailNotSentError(f'Email with subject "{email["Subject"]}" not sent to {email["To"]} because of "{e}"')


def send_message_sync(subject: str,
                      message: str,
                      to: list[str] | None = None,
                      cc: list[str] | None = None,
                      bcc: list[str] | None = None,
                      sender: str | None = None) -> bool:
    email = construct_email(sender=sender, to=to, cc=cc, bcc=bcc, subject=subject, message=message)
    return send_email_sync(email)


def send_email_sync(email: EmailMessage) -> bool:
    host = settings.SMTP_HOST
    port = settings.SMTP_PORT

    if not settings.MAILING_ENABLED or host is None or port is None:
        raise EmailNotSentError(f'Mailing system inactive, '
                                f'email with subject "{email["Subject"]}" not sent to {email["To"]}')

    if email['From'] is None:
        del email['From']
        email['From'] = settings.MAILING_SENDER

    try:
        client: SMTP_SSL | SMTPSync
        if not settings.SMTP_TLS:
            client = SMTP_SSL(host=host, port=port)
        else:
            client = SMTPSync(host=host, port=port)

        with client as smtp:
            user = settings.SMTP_USER
            password = settings.SMTP_PASSWORD
            if user is not None and password is not None:
                smtp.login(user=user, password=password)

            smtp.connect()
            logger.info(f'Trying to send email to {email["To"]} with subject "{email["Subject"]}"')
            status = smtp.send_message(email)
            logger.debug(status)
            logger.info(f'Successfully sent email to {email["To"]} with subject "{email["Subject"]}"')

            return True

    except (SMTPHeloErrorOrig, SMTPRecipientsRefusedOrig, SMTPSenderRefusedOrig,
            SMTPDataError, SMTPNotSupportedError, SMTPExceptionOrig) as e:
        logger.warning(f'Failed sending email to {email["To"]} with subject "{email["Subject"]}"')
        logger.error(e)
        raise EmailNotSentError(f'Email with subject "{email["Subject"]}" not sent to {email["To"]} because of "{e}"')
