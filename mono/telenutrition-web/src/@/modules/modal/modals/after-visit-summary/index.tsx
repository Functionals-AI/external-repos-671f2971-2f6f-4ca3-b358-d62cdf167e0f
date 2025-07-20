import React from 'react';

import Modal from '@/modules/modal/ui/modal';
import Card from '@/ui-components/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/ui-components/avatar';
import { UserEncounterRecord } from 'api/types';
import { Trans, useTranslation } from 'react-i18next';

import { DateTime } from 'luxon';
import HyperlinkedText from "@/ui-components/hyperlinked-text";

export default function AfterVisitSummaryModal({ encounter }: { encounter: UserEncounterRecord }) {
  const { t } = useTranslation();

  const startDateTime = encounter.actualStarttime
    ? DateTime.fromISO(encounter.actualStarttime)
    : null;
  const endDateTime = encounter.actualEndtime ? DateTime.fromISO(encounter.actualEndtime) : null;

  return (
    <Modal size="md">
      <Modal.Header title={t('After Visit Summary')} />
      <Modal.Body>
        <Card className="w-96 mb-10">
          {startDateTime && (
            <Card.Row>
              <Card.Row.Label className="w-32">
                <Trans>Date</Trans>
              </Card.Row.Label>
              <Card.Row.Col className="px-2 py-1">
                {startDateTime.toLocaleString(DateTime.DATE_FULL)}
              </Card.Row.Col>
            </Card.Row>
          )}
          {startDateTime && endDateTime && (
            <Card.Row>
              <Card.Row.Label className="w-32">
                <Trans>Time</Trans>
              </Card.Row.Label>
              <Card.Row.Col className="px-2 py-1">
                {startDateTime.toLocaleString(DateTime.TIME_SIMPLE)} -{' '}
                {endDateTime.toLocaleString(DateTime.TIME_SIMPLE)}
              </Card.Row.Col>
            </Card.Row>
          )}

          <Card.Row>
            <Card.Row.Label className="w-32">
              <Trans>Reason for visit</Trans>
            </Card.Row.Label>
            <Card.Row.Col className="px-2 py-1">
              {encounter.reasonForVisit ?? <Trans>Unknown reason</Trans>}
            </Card.Row.Col>
          </Card.Row>

          <Card.Row>
            <Card.Row.Label className="w-32">
              <Trans>Visit type</Trans>
            </Card.Row.Label>
            <Card.Row.Col className="px-2 py-1">
              {encounter.isAudioOnly ? <Trans>Audio only</Trans> : <Trans>Video</Trans>}
            </Card.Row.Col>
          </Card.Row>
        </Card>
        <h4 className="font-bold text h-8">
          <Trans>Instructions</Trans>
        </h4>

        <div className="border border-r-neutral-115 rounded-lg p-4">
          <div className="mb-5">
            {encounter.noteToMember ? (
              <HyperlinkedText text={encounter.noteToMember} />
            ) : (
              <span className="text-neutral-600">
                <Trans>
                  No specific instructions were provided by your provider for this visit.
                </Trans>
              </span>
            )}
          </div>
          <div className="w-full flex flex-row items-center justify-end">
            <Avatar className="w-9 h-9 mr-2">
              <AvatarImage src={encounter.providerPhoto} />
              <AvatarFallback className="border border-neutral-200 bg-status-green-100">
                {encounter.providerInitials}
              </AvatarFallback>
            </Avatar>
            <div>{encounter.providerName}</div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
