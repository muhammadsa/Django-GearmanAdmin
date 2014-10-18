__author__ = 'Muhammads'


def to_bool(value):
    if value is None:
        return False

    value_type = type(value)

    if value_type == bool:
        return value
    elif value_type == str or value_type == unicode:
        if value is None or value == '' or value.lower() == 'false':
            return False
        else:
            return True
    elif value_type == int:
        if value is None or value == 0:
            return False
        else:
            return True

    else:
        return False