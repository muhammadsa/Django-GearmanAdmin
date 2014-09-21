import gearman


class GearmanConnection(object):
    
    def __init__(self, servers):
        self.servers = servers
        try:
            self.admin_client = gearman.GearmanAdminClient(self.servers)
        except:
            return
    
    def get_connection(self):
        if self.admin_client is None and (self.servers is None or self.servers == ""):
            return None
        elif self.admin_client is None:
            self.admin_client = gearman.GearmanAdminClient(self.servers)
        else:
            return self.admin_client