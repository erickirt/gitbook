'use client';

import { Icon } from '@gitbook/icons';
import * as React from 'react';

import { Button, StyledLink } from '@/components/primitives';
import { useLanguage } from '@/intl/client';
import { t, tString } from '@/intl/translate';
import { tcls } from '@/lib/tailwind';

import { isCookiesTrackingDisabled, setCookiesTracking } from '../Insights';

/**
 * Toast to accept or reject the use of cookies.
 */
export function CookiesToast(props: { privacyPolicy?: string }) {
    const { privacyPolicy = 'https://policies.gitbook.com/privacy/cookies' } = props;
    const [show, setShow] = React.useState(false);
    const language = useLanguage();

    React.useEffect(() => {
        setShow(isCookiesTrackingDisabled() === undefined);
    }, []);

    if (!show) {
        return null;
    }

    const onUpdateState = (enabled: boolean) => {
        setCookiesTracking(enabled);
        // Reload the page to take the change in consideration
        window.location.reload();
    };

    const describedById = 'cookies-description';

    return (
        <div
            role="dialog"
            data-testid="cookies-dialog"
            aria-modal="true"
            aria-label={tString(language, 'cookies_title')}
            aria-describedby={describedById}
            className={tcls(
                'fixed',
                'z-10',
                'bg-tint-base',
                'rounded',
                'straight-corners:rounded-none',
                'circular-corners:rounded-2xl',
                'ring-1',
                'ring-tint-subtle',
                'shadow-1xs',
                'depth-flat:shadow-none',
                'p-4',
                'pr-8',
                'bottom-4',
                'right-4',
                'left-16',
                'max-w-md',
                'text-balance',
                'sm:left-auto',
                'lg:chat-open:mr-80',
                'xl:chat-open:mr-[25rem]',
                'transition-all',
                'duration-300'
            )}
        >
            <p id={describedById} className={tcls('text-sm')}>
                {t(
                    language,
                    'cookies_prompt',
                    <StyledLink href={privacyPolicy}>
                        {t(language, 'cookies_prompt_privacy')}
                    </StyledLink>
                )}
            </p>
            <button
                type="button"
                onClick={() => setShow(false)}
                aria-label={tString(language, 'close')}
                className={tcls(
                    'absolute',
                    'top-3',
                    'right-3',
                    'w-6',
                    'h-6',
                    'flex',
                    'justify-center',
                    'items-center',
                    'rounded-sm',
                    'circular-corners:rounded-full',
                    'hover:bg-tint-hover'
                )}
                title={tString(language, 'close')}
            >
                <Icon icon="xmark" className={tcls('size-4')} />
            </button>
            <div className={tcls('mt-3', 'flex', 'flex-row', 'gap-2')}>
                <Button
                    variant="primary"
                    size="small"
                    aria-label={tString(language, 'cookies_accept')}
                    onClick={() => {
                        onUpdateState(true);
                    }}
                    label={tString(language, 'cookies_accept')}
                />
                <Button
                    variant="secondary"
                    size="small"
                    aria-label={tString(language, 'cookies_reject')}
                    onClick={() => {
                        onUpdateState(false);
                    }}
                    label={tString(language, 'cookies_reject')}
                />
            </div>
        </div>
    );
}
