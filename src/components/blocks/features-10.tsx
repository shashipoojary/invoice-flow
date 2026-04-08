'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  CheckCircle,
  ChevronRight,
  FilePlus,
  FileText,
  Send,
  Shield,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';

/**
 * Images: public/features/<imageFile>
 */
export const FEATURE_IMAGE_FOLDER = '/features';

type FeatureVariant = 'spotlight' | 'standard' | 'compact';

/** `top` = keep header/chrome visible; `bottom-right` = flush to bottom+right like hero mock. */
type ImageAnchor = 'top' | 'bottom-right';

type FeatureDef = {
  variant: FeatureVariant;
  imageFile: string;
  Icon: LucideIcon;
  title: string;
  headline: string;
  description: string;
  /** Spotlight cards only */
  spotlightImageAnchor?: ImageAnchor;
  /** Spotlight cards: force image to touch bottom on mobile + desktop */
  spotlightForceBottomAlign?: boolean;
  /** Full-width standard cards: default `bottom-right` (wide hero fit). Set `top` to prefer top of screenshot. */
  standardImageAnchor?: ImageAnchor;
};

/**
 * `variant` drives layout: spotlight = hero bento, standard = medium card + image, compact = small tile.
 * Reorder or change variant to match how much each feature needs.
 */
const FEATURES: FeatureDef[] = [
  {
    variant: 'spotlight',
    spotlightImageAnchor: 'top',
    imageFile: 'professional-templates.png',
    Icon: FileText,
    title: 'Professional Templates',
    headline: 'Invoices that match your brand.',
    description:
      'Choose from multiple professional invoice templates. Customize colors, fonts, and layout to match your brand.',
  },
  {
    variant: 'spotlight',
    spotlightImageAnchor: 'bottom-right',
    imageFile: 'client-management.png',
    Icon: Users,
    title: 'Client Management',
    headline: 'Every client, one place.',
    description:
      'Store client information, payment history, and communication logs. Never lose track of important details.',
  },
  {
    variant: 'spotlight',
    spotlightImageAnchor: 'bottom-right',
    spotlightForceBottomAlign: true,
    imageFile: 'payment-tracking.png',
    Icon: BarChart3,
    title: 'Payment Tracking',
    headline: "See what's paid and what's not.",
    description:
      'Track when clients view invoices and manually mark payments as received. Get clear visibility into payment status.',
  },
  {
    variant: 'spotlight',
    spotlightImageAnchor: 'top',
    spotlightForceBottomAlign: true,
    imageFile: 'automated-reminders.png',
    Icon: Bell,
    title: 'Automated Reminders',
    headline: 'Follow-ups on your schedule.',
    description:
      'Set up custom reminder schedules for each invoice. Choose from friendly, polite, firm, or urgent reminder types.',
  },
  {
    variant: 'compact',
    imageFile: 'late-fee-management.png',
    Icon: Zap,
    title: 'Late Fee Management',
    headline: 'Late fees, calculated for you.',
    description:
      'Automatically calculate and apply late fees. Set fixed amounts or percentages with grace periods.',
  },
  {
    variant: 'spotlight',
    spotlightImageAnchor: 'bottom-right',
    spotlightForceBottomAlign: true,
    imageFile: 'multiple-payment-methods.png',
    Icon: CheckCircle,
    title: 'Multiple Payment Methods',
    headline: 'Let clients pay their way.',
    description:
      'Support PayPal, Stripe, Cash App, Venmo, Google Pay, Apple Pay, and bank transfers.',
  },
  {
    variant: 'compact',
    imageFile: 'pdf-generation.png',
    Icon: FileText,
    title: 'PDF Generation',
    headline: 'Print-ready PDFs instantly.',
    description:
      'Generate professional PDF invoices instantly. Download and share with clients or print for your records.',
  },
  {
    variant: 'spotlight',
    spotlightImageAnchor: 'bottom-right',
    spotlightForceBottomAlign: true,
    imageFile: 'analytics-dashboard.png',
    Icon: BarChart3,
    title: 'Analytics Dashboard',
    headline: 'Revenue and pipeline at a glance.',
    description:
      'Track revenue, pending payments, overdue invoices, and late fees. Get insights into your business performance.',
  },
  {
    variant: 'compact',
    imageFile: 'secure-reliable.png',
    Icon: Shield,
    title: 'Secure & Reliable',
    headline: 'Your data stays yours.',
    description:
      'Enterprise-grade security with encrypted data storage and transmission. Your data is never shared with third parties.',
  },
];

export function Features() {
  const spotlight = FEATURES.filter((f) => f.variant === 'spotlight');
  const standardItems = FEATURES.filter((f) => f.variant === 'standard');

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="features-bento scroll-mt-20 relative overflow-hidden border-t border-zinc-800 bg-zinc-950 py-12 text-zinc-100 sm:py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_100%_0%,rgba(168,85,247,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_100%,rgba(147,51,234,0.08),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-5xl lg:px-8">
        <header className="mx-auto mb-8 max-w-2xl text-center lg:mx-0 lg:mb-10 lg:text-left">
          <h2
            id="features-heading"
            className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl"
          >
            Get paid faster
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
            Invoicing, reminders, and payments in one flow—built for freelancers and small teams.
          </p>
        </header>

        <div className="mx-auto grid gap-4 lg:grid-cols-2">
          {spotlight.map((f) => (
            <LargeFeatureCard key={f.title} feature={f} />
          ))}
        </div>

        <FeatureCard className="mt-4 p-4 sm:mt-5 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 sm:gap-6">
            <p className="mx-auto max-w-lg text-balance text-center font-heading text-base font-semibold leading-snug text-zinc-100 sm:text-lg md:text-xl">
              Smart invoicing with automated reminders—so you spend less time chasing payments.
            </p>

            <InvoiceFlowSteps />
          </div>
        </FeatureCard>

        {/* Standards: full-width rows sized for longer copy + medium image */}
        <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
          {standardItems.map((f) => (
            <StandardFeatureCard key={f.title} feature={f} />
          ))}
        </div>

      </div>
    </section>
  );
}

function featurePhotoProps(f: FeatureDef) {
  return {
    src: `${FEATURE_IMAGE_FOLDER}/${f.imageFile}`,
    alt: f.title,
    hintPath: `public/features/${f.imageFile}`,
  };
}

function LargeFeatureCard({ feature: f }: { feature: FeatureDef }) {
  const photo = featurePhotoProps(f);
  return (
    <FeatureCard>
      <CardHeader className="p-0 pb-0">
        <CardHeadingLarge icon={f.Icon} kicker={f.title} headline={f.headline} />
      </CardHeader>
      <p className="px-5 pb-3 text-xs leading-relaxed text-zinc-400 sm:px-6 sm:pb-4 sm:text-sm">{f.description}</p>

      <div className="relative border-t border-dashed border-zinc-600/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(39,39,42,0.9),rgb(9,9,11)_125%)]" />
        <div
          className={cn(
            'relative aspect-[76/59] w-full overflow-hidden pl-4 pt-3 pr-0 pb-0 sm:pl-6 sm:pt-4',
            // Keep all spotlight cards on the same image placement and top gap.
            'pt-10 sm:pt-12',
          )}
        >
          <FeaturePhoto
            {...photo}
            variant="large"
            anchor={f.spotlightImageAnchor ?? 'top'}
            forceBottomAlign={f.spotlightForceBottomAlign}
          />
        </div>
      </div>
    </FeatureCard>
  );
}

/** Medium card: full description, shorter image than spotlight */
function StandardFeatureCard({ feature: f }: { feature: FeatureDef }) {
  const Icon = f.Icon;
  const photo = featurePhotoProps(f);
  return (
    <FeatureCard className="md:min-h-[23rem] lg:min-h-[24rem]">
      <div className="flex flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 size-5 shrink-0 text-violet-400" aria-hidden />
          <div className="min-w-0">
            <h3 className="font-heading text-sm font-semibold text-zinc-100 sm:text-base">{f.title}</h3>
            <p className="mt-1 text-sm font-medium leading-snug text-violet-200/90">{f.headline}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">{f.description}</p>
          </div>
        </div>
      </div>
      <div className="relative border-t border-dashed border-zinc-600/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_0%,transparent_45%,rgba(24,24,27,0.92)_100%)]" />
        <div className="relative min-h-[210px] w-full overflow-hidden pl-2 pt-5 pr-0 pb-0 max-sm:min-h-[220px] sm:min-h-[270px] sm:pl-5 sm:pt-6 lg:min-h-[300px] lg:pl-6 lg:pt-7">
          <FeaturePhoto
            {...photo}
            variant="standard"
            standardAnchor={f.standardImageAnchor ?? 'top'}
          />
        </div>
      </div>
    </FeatureCard>
  );
}

/** Small tile: tight copy + short image strip */
function CompactFeatureCard({ feature: f }: { feature: FeatureDef }) {
  const Icon = f.Icon;
  const photo = featurePhotoProps(f);
  return (
    <FeatureCard>
      <div className="flex flex-col p-3 sm:p-3.5">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 size-3.5 shrink-0 text-violet-400 sm:size-4" aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-[11px] font-semibold leading-tight text-zinc-100 sm:text-xs">{f.title}</h3>
            <p className="mt-0.5 text-[10px] font-medium leading-snug text-violet-300/90 sm:text-[11px]">{f.headline}</p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-zinc-500 sm:line-clamp-3 sm:text-[11px]">
              {f.description}
            </p>
          </div>
        </div>
      </div>
      <div className="relative border-t border-dashed border-zinc-600/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,transparent_50%,rgba(24,24,27,0.95)_100%)]" />
        <div className="relative h-[5.75rem] overflow-hidden px-2 pt-1.5 sm:h-[6.25rem] sm:px-2.5">
          <FeaturePhoto {...photo} variant="compact" />
        </div>
      </div>
    </FeatureCard>
  );
}

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card
    className={cn(
      'group relative h-full overflow-hidden rounded-none border-zinc-700/90 bg-zinc-900/70 text-zinc-100 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)]',
      className,
    )}
  >
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2 border-violet-500" />
    <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2 border-violet-500" />
    <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 border-violet-500" />
    <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 border-violet-500" />
  </>
);

function CardHeadingLarge({ icon: Icon, kicker, headline }: { icon: LucideIcon; kicker: string; headline: string }) {
  return (
    <div className="p-5 pb-0 sm:p-6">
      <span className="flex items-center gap-2 text-xs font-medium text-zinc-400 sm:text-sm">
        <Icon className="size-4 shrink-0 text-violet-400" aria-hidden />
        {kicker}
      </span>
      <p className="mt-5 font-heading text-lg font-semibold leading-snug text-zinc-50 sm:mt-6 sm:text-xl md:text-2xl">
        {headline}
      </p>
    </div>
  );
}

function FeaturePhotoPlaceholder({ hintPath, size }: { hintPath: string; size: 'large' | 'standard' | 'compact' }) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center border border-dashed border-zinc-600/80 bg-zinc-950/80 px-2 text-center',
        size === 'compact' && 'py-2',
        size === 'standard' && 'py-4',
        size === 'large' && 'py-6',
      )}
    >
      <p
        className={cn(
          'leading-snug text-zinc-500',
          size === 'compact' && 'text-[8px] sm:text-[9px]',
          size === 'standard' && 'text-[9px] sm:text-[10px]',
          size === 'large' && 'text-[10px] sm:text-xs',
        )}
      >
        Add:
        <br />
        <code className="mt-0.5 inline-block break-all font-mono text-violet-400/90">{hintPath}</code>
      </p>
    </div>
  );
}

/** Shell min-heights for each card size. */
function featurePhotoShellClass(variant: 'large' | 'standard' | 'compact') {
  return cn(
    'relative h-full w-full overflow-hidden',
    // Give large hero/spotlight images extra vertical room on mobile
    // so the top of screenshots (like "Follow-ups on your schedule.") isn’t cut off.
    variant === 'large' && 'min-h-[190px] sm:min-h-[220px]',
    variant === 'standard' && 'min-h-[210px] sm:min-h-[270px] lg:min-h-[300px]',
    variant === 'compact' && 'min-h-[4.75rem] sm:min-h-[5.5rem]',
  );
}

function featurePhotoInsetLeft(
  variant: 'large' | 'standard' | 'compact',
  anchor: 'top' | 'bottom-right',
) {
  if (variant === 'large') return 'left-4 sm:left-6 md:left-4 lg:left-8';
  if (variant === 'standard' && anchor === 'bottom-right') {
    /* Tighter left on small screens so the image can hug bottom-right */
    return 'left-1 sm:left-6 md:left-4 lg:left-8';
  }
  if (variant === 'standard') return 'left-3 sm:left-5 md:left-3 lg:left-6';
  return 'left-2 sm:left-3 md:left-2';
}

function featurePhotoImgClass(
  variant: 'large' | 'standard' | 'compact',
  anchor: 'top' | 'bottom-right' = 'top',
  forceBottomAlign = false,
) {
  const brCrop = 'object-cover object-bottom-right origin-bottom-left';
  const topCrop = 'object-cover object-top-right origin-top-left';
  /** Spotlight large only: flush bottom-right. Standard wide cards use their own branch (top preserved). */
  const crop = variant === 'large' && anchor === 'bottom-right' ? brCrop : topCrop;
  const motion =
    'h-auto w-full opacity-90 transition-opacity duration-300 group-hover:opacity-100';
  const shadow = 'shadow-[0_22px_60px_-16px_rgba(0,0,0,0.52)]';
  if (variant === 'large') {
    if (anchor === 'top' && !forceBottomAlign) {
      return cn(
        crop,
        motion,
        shadow,
        // Normalize spotlight screenshots to the same top-aligned framing as
        // "Invoices that match your brand." so all cards feel consistent.
        'max-w-[min(520px,100%)] translate-x-0 scale-[1.08] sm:max-w-[min(560px,100%)] sm:translate-x-0 sm:scale-[1.08] md:scale-[1.06] lg:max-w-[min(620px,100%)] lg:scale-[1.04]',
      );
    }
    return cn(
      forceBottomAlign
        ? 'object-cover object-bottom-right origin-bottom-left'
        : 'object-cover object-top-right origin-top-left sm:object-bottom-right sm:origin-bottom-left',
      motion,
      shadow,
      'max-w-[min(520px,100%)] translate-x-0 scale-[1.08] sm:max-w-[min(400px,100%)] sm:translate-x-4 sm:scale-[1.22] md:translate-x-0 md:scale-[1.14] lg:max-w-[min(480px,100%)] lg:scale-[1.08]',
    );
  }
  if (variant === 'standard' && anchor === 'bottom-right') {
    return cn(
      /* Keep top of screenshot visible; crop overflow at bottom + right only */
      'object-cover object-left-top origin-top-left',
      motion,
      'shadow-[0_20px_55px_-14px_rgba(0,0,0,0.5)]',
      /* <sm: full-bleed width, flush right, extra zoom; sm+: original tuning */
      'w-full max-w-full translate-x-0 scale-[1.22]',
      'sm:max-w-[min(880px,95%)] sm:translate-x-3 sm:scale-[1.1]',
      'md:translate-x-0 md:scale-[1.06]',
      'lg:max-w-[min(960px,94%)] lg:scale-[1.04]',
    );
  }
  if (variant === 'standard') {
    return cn(
      crop,
      motion,
      'shadow-[0_16px_44px_-12px_rgba(0,0,0,0.48)]',
      'max-w-[min(320px,100%)] translate-x-2 scale-[1.2] sm:max-w-[min(300px,100%)] sm:translate-x-3 sm:scale-[1.12] md:translate-x-0 md:scale-[1.06] lg:max-w-[min(360px,100%)] lg:scale-[1.03]',
    );
  }
  return cn(
    crop,
    motion,
    'shadow-[0_10px_28px_-8px_rgba(0,0,0,0.42)]',
    'max-w-[min(168px,100%)] translate-x-2 scale-[1.16] sm:max-w-[min(180px,100%)] sm:translate-x-2.5 sm:scale-[1.1] md:translate-x-0 md:scale-[1.04]',
  );
}

function featurePhotoPositionClass(
  variant: 'large' | 'standard' | 'compact',
  anchor: 'top' | 'bottom-right' = 'top',
  forceBottomAlign = false,
) {
  if (variant === 'large') {
    if (forceBottomAlign || anchor === 'bottom-right') {
      return 'absolute right-0 top-0 bottom-0 flex justify-end items-end';
    }
    return 'absolute right-0 top-0 bottom-0 flex justify-end items-start';
  }
  if (variant === 'standard' && anchor === 'bottom-right') {
    /* Standard wide: desktop = top-right; mobile = bottom-right flush like desktop hero */
    return 'absolute top-0 right-0 bottom-0 flex justify-end max-sm:items-end sm:items-start';
  }
  return 'absolute top-0 right-0 bottom-0 flex items-start justify-end';
}

function FeaturePhoto({
  src,
  alt,
  hintPath,
  variant,
  anchor = 'top',
  standardAnchor = 'bottom-right',
  forceBottomAlign = false,
}: {
  src: string;
  alt: string;
  hintPath: string;
  variant: 'large' | 'standard' | 'compact';
  /** Spotlight `large` cards */
  anchor?: 'top' | 'bottom-right';
  /** Full-width `standard` cards (default bottom-right = wide hero fit) */
  standardAnchor?: 'top' | 'bottom-right';
  /** Spotlight-only: when true, force bottom touch on all breakpoints */
  forceBottomAlign?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const effectiveAnchor =
    variant === 'compact'
      ? 'top'
      : variant === 'large'
        ? anchor
        : standardAnchor;

  return (
    <div className={featurePhotoShellClass(variant)}>
      {failed ? (
        <FeaturePhotoPlaceholder hintPath={hintPath} size={variant} />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className={cn(
                featurePhotoPositionClass(variant, effectiveAnchor, forceBottomAlign),
                featurePhotoInsetLeft(variant, effectiveAnchor),
              )}
            >
              <Image
                src={src}
                alt={alt}
                width={1200}
                height={750}
                className={featurePhotoImgClass(
                  variant,
                  effectiveAnchor,
                  forceBottomAlign,
                )}
                sizes={
                  variant === 'compact'
                    ? '(max-width: 640px) 45vw, 22vw'
                    : variant === 'standard'
                      ? '(max-width: 639px) 100vw, (max-width: 1024px) 95vw, 80vw'
                      : '(max-width: 1024px) 95vw, 48vw'
                }
                onError={() => setFailed(true)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const INVOICE_FLOW_STEPS: {
  label: string;
  hint: string;
  Icon: LucideIcon;
}[] = [
  { label: 'Create', hint: 'Draft & line items', Icon: FilePlus },
  { label: 'Send', hint: 'Email or share link', Icon: Send },
  { label: 'Remind', hint: 'Auto follow-ups', Icon: Bell },
  { label: 'Paid', hint: 'Mark when money lands', Icon: BadgeCheck },
];

function InvoiceFlowSteps() {
  return (
    <div
      className="flex flex-wrap items-start justify-center gap-x-2 gap-y-6 sm:gap-x-3 md:gap-x-2 md:gap-y-8"
      role="list"
      aria-label="Invoice workflow steps"
    >
      {INVOICE_FLOW_STEPS.map((step, index) => {
        const Icon = step.Icon;
        return (
        <div key={step.label} className="flex items-center gap-x-2 sm:gap-x-3 md:gap-x-2">
          <div role="listitem" className="flex w-[7.25rem] flex-col items-center sm:w-[8.5rem]">
            <div className="flex h-14 w-14 items-center justify-center !rounded-full border border-violet-500/35 bg-gradient-to-b from-zinc-800 to-zinc-900 text-violet-300 shadow-[0_12px_32px_-12px_rgba(124,58,237,0.35)] ring-1 ring-white/5 sm:h-16 sm:w-16">
              <Icon className="size-7 sm:size-8" strokeWidth={1.65} aria-hidden />
            </div>
            <span className="mt-2.5 text-center font-heading text-xs font-semibold text-zinc-100 sm:text-sm">
              {step.label}
            </span>
            <span className="mt-0.5 max-w-[9rem] text-center text-[10px] leading-snug text-zinc-500 sm:text-[11px]">
              {step.hint}
            </span>
          </div>
          {index < INVOICE_FLOW_STEPS.length - 1 ? (
            <ChevronRight
              className="mb-8 hidden h-5 w-5 shrink-0 text-zinc-600 md:block"
              aria-hidden
              strokeWidth={2}
            />
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
