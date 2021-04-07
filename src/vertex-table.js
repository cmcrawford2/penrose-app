const nextVertexTable = {
    'A': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'B': { next: '', fatAdd: 'D', skinnyAdd: 'H' }, // Can add D or H
    'C': { next: '', fatAdd: 'C', skinnyAdd: 'G' }, // Can add C or G
    'D': { next: '', fatAdd: 'B', skinnyAdd: 'E' }, // Can add B or E
    'E': { next: 'B', fatAdd: 'B', skinnyAdd: '' },
    'F': { next: '', fatAdd: 'D', skinnyAdd: 'H' }, // Can add D or H
    'G': { next: '', fatAdd: 'C', skinnyAdd: 'G' }, // Can add C or G
    'H': { next: 'A', fatAdd: '', skinnyAdd: '' },
    'AA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'AF': { next: '', fatAdd: 'D', skinnyAdd: 'H' }, // Can add D or H
    'BD': { next: 'E', fatAdd: '', skinnyAdd: 'E' },
    'BH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'CC': { next: '', fatAdd: 'C', skinnyAdd: 'G' }, // Can add C or G
    'CG': { next: '', fatAdd: 'C', skinnyAdd: 'G' }, // Can add C or G
    'DB': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'DE': { next: 'B', fatAdd: 'B', skinnyAdd: '' },
    'EB': { next: 'D', fatAdd: 'D', skinnyAdd: '' },
    'FD': { next: 'B', fatAdd: 'B', skinnyAdd: '' },
    'FH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'GC': { next: '', fatAdd: 'C', skinnyAdd: 'G' }, // Can add C or G
    'GG': { next: 'C', fatAdd: 'C', skinnyAdd: '' },
    'HA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'AAA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'AAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'AFD': { next: 'B', fatAdd: 'B', skinnyAdd: '' },
    'AFH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'BHA': { next: 'F', fatAdd: '', skinnyAdd: 'F' },
    'CCC': { next: '', fatAdd: 'C', skinnyAdd: 'G' }, // Can add C or G
    'CCG': { next: 'C', fatAdd: 'C', skinnyAdd: '' },
    'CGC': { next: 'C', fatAdd: 'C', skinnyAdd: '' },
    'DBH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'FDB': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'GCC': { next: 'C', fatAdd: 'C', skinnyAdd: '' },
    'HAA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'HAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'AAAA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'AAAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'AAFH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'AFDB': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'AFHA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'BHAF': { next: 'D', fatAdd: 'D', skinnyAdd: '' },
    'CCCC': { next: 'D', fatAdd: 'D', skinnyAdd: '' },
    'DBHA': { next: 'F', fatAdd: '', skinnyAdd: 'F' },
    'FDBH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'FHAA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'FHAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'HAAA': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'HAAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'HAFH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'AAAAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'AAAFH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'AAFHA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'AFHAA': { next: '', fatAdd: 'A', skinnyAdd: 'F' }, // Can add A or F
    'AFHAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'FHAAA': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'FHAAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'FHAFH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'HAAAA': { next: 'F', fatAdd: '', skinnyAdd: 'F' },
    'HAAFH': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'HAFHA': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'AAFHAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'AFHAAF': { next: 'H', fatAdd: '', skinnyAdd: 'H' },
    'FHAFHA': { next: 'A', fatAdd: 'A', skinnyAdd: '' },
    'HAAFHA': { next: 'F', fatAdd: '', skinnyAdd: 'F' },
    'HAFHAA': { next: 'F', fatAdd: '', skinnyAdd: 'F' },
    
};

export default nextVertexTable;