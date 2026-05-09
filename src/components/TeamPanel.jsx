import Pitch from '@/components/Pitch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

export default function TeamPanel({
  match,
  players,
  isMine,
  isParticipant,
  onToggleJoin,
  onFormationChange,
  onFormationType,
  formationOptions = []
}) {
  if (!match) {
    return (
      <Card className="h-full">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          상대팀이 아직 합류하지 않았어요.
        </CardContent>
      </Card>
    );
  }

  const formation = match.homeTeam.formation;
  const playerUids = match.homeTeam.playerUids ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{match.homeTeam.name}</CardTitle>
            <Badge variant={isMine ? 'default' : 'outline'}>
              {isMine ? '내 팀' : '상대팀'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{playerUids.length}명</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Roster */}
        <div className="space-y-2">
          {isMine && (
            <Button
              size="sm"
              variant={isParticipant ? 'outline' : 'default'}
              onClick={onToggleJoin}
              className="w-full"
            >
              {isParticipant ? '참가 취소' : '참가하기'}
            </Button>
          )}
          {players.length === 0 ? (
            <p className="text-xs text-muted-foreground">아직 참가자가 없어요.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-xs"
                >
                  <Avatar src={p.photoURL} name={p.displayName} size={18} />
                  <span className="max-w-[80px] truncate">{p.displayName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formation type selector */}
        {isMine && formationOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {formationOptions.map(([key, tpl]) => (
              <Button
                key={key}
                size="sm"
                variant={formation?.type === key ? 'default' : 'outline'}
                onClick={() => onFormationType(key)}
              >
                {tpl.label}
              </Button>
            ))}
          </div>
        )}

        {/* Pitch */}
        {formation?.positions?.length > 0 && (
          <Pitch
            formation={formation}
            players={players}
            onChange={isMine ? onFormationChange : undefined}
            readOnly={!isMine}
          />
        )}
      </CardContent>
    </Card>
  );
}
