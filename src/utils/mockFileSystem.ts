export type NodeType = 'file' | 'dir';

export interface FileNode {
  type: 'file';
  content: string;
}

export interface DirNode {
  type: 'dir';
  children: Record<string, Node>;
}

export type Node = FileNode | DirNode;

export const MOCK_FS: DirNode = {
  type: 'dir',
  children: {
    home: {
      type: 'dir',
      children: {
        user: {
          type: 'dir',
          children: {
            Desktop: {
              type: 'dir',
              children: {
                '.flag.txt': {
                  type: 'file',
                  content: 'AVVA{w3lc0m3_t0_th3_m4tr1x}\n\n"The only way out is through the terminal."',
                },
                'notes.txt': {
                  type: 'file',
                  content: 'Note to self: The AI project is almost complete. Need to finish the rendering pipeline.',
                },
              },
            },
            Documents: {
              type: 'dir',
              children: {
                'project_specs.md': {
                  type: 'file',
                  content: '# Project Specifications\n- Realtime 3D Rendering\n- Kinematics & Physics\n- AI Companion integration',
                },
              },
            },
            Downloads: {
              type: 'dir',
              children: {},
            },
          },
        },
      },
    },
    etc: {
      type: 'dir',
      children: {
        'os-release': {
          type: 'file',
          content: 'NAME="Ubuntu"\nVERSION="22.04 LTS (Jammy Jellyfish)"',
        },
      },
    },
    var: {
      type: 'dir',
      children: {
        log: {
          type: 'dir',
          children: {
            'syslog': {
              type: 'file',
              content: 'Dec 12 10:45:01 ubuntu systemd[1]: Started Session 1 of user user.',
            },
          },
        },
      },
    },
  },
};

export function resolvePath(currentPath: string, targetPath: string): string | null {
  if (!targetPath) return currentPath;

  const parts = targetPath.split('/');
  let resolvedParts = currentPath.split('/').filter(Boolean);

  if (targetPath.startsWith('/')) {
    resolvedParts = [];
  }

  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      resolvedParts.pop();
    } else {
      resolvedParts.push(part);
    }
  }

  const finalPath = '/' + resolvedParts.join('/');
  return finalPath;
}

export function getNodeAtPath(path: string): Node | null {
  const parts = path.split('/').filter(Boolean);
  let current: Node = MOCK_FS;

  for (const part of parts) {
    if (current.type !== 'dir') return null;
    if (!(part in current.children)) return null;
    current = current.children[part];
  }

  return current;
}
