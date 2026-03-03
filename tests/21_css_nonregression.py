import re

WS = set(' \t\n\r')

def sc(t):
    return re.sub(r'/[*][\s\S]*?[*]/', '', t)

def np(b):
    d = [x.strip() for x in b.split(';') if x.strip()]
    d = [re.sub(r'\s+', ' ', x) for x in d]
    d.sort()
    return '; '.join(d)

def pc(text):
    text = sc(text)
    r = []
    def ex(bl, m):
        p = 0
        n = len(bl)
        while p < n:
            while p < n and bl[p] in WS:
                p += 1
            if p >= n:
                break
            bi = bl.find('{', p)
            if bi == -1:
                break
            s = bl[p:bi].strip()
            d = 1
            j = bi + 1
            while j < n and d > 0:
                if bl[j] == '{':
                    d += 1
                elif bl[j] == '}':
                    d -= 1
                j += 1
            c = bl[bi+1:j-1].strip()
            p = j
            if not s:
                continue
            if s.startswith('@keyframes'):
                r.append((s, '[kf]', m))
                continue
            if s.startswith('@media'):
                ex(c, re.sub(r'\s+', ' ', s).strip())
                continue
            if s.startswith('@page'):
                r.append((s, np(c), m))
                continue
            r.append((re.sub(r'\s+', ' ', s), np(c), m))
    ex(text, None)
    return r

def sk(rule):
    prefix = (rule[2] + ' >> ') if rule[2] else ''
    return prefix + rule[0]

def snap(path):
    f = open(path)
    css = f.read()
    f.close()
    d = {}
    for rule in pc(css):
        d[sk(rule)] = rule[1]
    return d

ref = snap('/home/claude/work/v065/v0.65/css/design-system.css')
mod = snap('/home/claude/work/design-system-v066.css')

mis = sorted(set(ref) - set(mod))
add = sorted(set(mod) - set(ref))
chg = [k for k in sorted(set(ref) & set(mod)) if ref[k] != mod[k]]
eq = len(set(ref) & set(mod)) - len(chg)

print('Ref: %d  Mod: %d' % (len(ref), len(mod)))
print('Manquants: %d  Modifies: %d  Identiques: %d  Ajoutes: %d' % (len(mis), len(chg), eq, len(add)))
print()
for k in mis:
    print('MANQUANT: ' + k)
for k in chg:
    print('MODIFIE: ' + k)
    print('  R: ' + ref[k][:120])
    print('  M: ' + mod[k][:120])
if not mis and not chg:
    print('*** SUCCES: NON-REGRESSION VALIDEE ***')
