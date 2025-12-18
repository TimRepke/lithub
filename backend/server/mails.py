import logging
from email.message import EmailMessage

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
    SMTPHeloError,
    SMTPTimeoutError,
)

from .config import settings

logger = logging.getLogger('server.util.email')


class EmailNotSentError(Exception):
    """
    Thrown when an email was not sent for some reason
    """

    pass


def construct_email(
    subject: str,
    message: str,
    to: list[str] | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    sender: str | None = None,
) -> EmailMessage:
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


async def send_message(
    subject: str,
    message: str,
    to: list[str] | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    sender: str | None = None,
    quiet: bool = False,
) -> bool:
    email = construct_email(sender=sender, to=to, cc=cc, bcc=bcc, subject=subject, message=message)
    return await send_email(email, quiet=quiet)


async def send_email(email: EmailMessage, quiet: bool) -> bool:
    if not settings.mailing_active:
        if quiet:
            return False
        raise EmailNotSentError(f'Mailing system inactive, email with subject "{email["Subject"]}" not sent to {email["To"]}')

    if email['From'] is None:
        del email['From']
        email['From'] = settings.MAILING_SENDER

    client = SMTP(
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        use_tls=settings.SMTP_TLS,
        start_tls=settings.SMTP_START_TLS,
        validate_certs=settings.SMTP_CHECK_CERT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
    )

    try:
        logger.debug(f'Trying to send email to {email["To"]} with subject "{email["Subject"]}"')
        async with client as s:
            status = await s.send_message(email)
            logger.debug(status)
        logger.info(f'Successfully sent email to {email["To"]} with subject "{email["Subject"]}"')
        return True

    except (
        SMTPRecipientsRefused,
        SMTPResponseException,
        ValueError,
        SMTPException,
        SMTPTimeoutError,
        SMTPAuthenticationError,
        SMTPNotSupported,
        SMTPConnectTimeoutError,
        SMTPConnectError,
        SMTPConnectResponseError,
        SMTPServerDisconnected,
        SMTPHeloError,
        SMTPSenderRefused,
    ) as e:
        logger.warning(f'Failed sending email to {email["To"]} with subject "{email["Subject"]}"')
        logger.error(e)
        raise EmailNotSentError(f'Email with subject "{email["Subject"]}" not sent to {email["To"]} because of "{e}"')
